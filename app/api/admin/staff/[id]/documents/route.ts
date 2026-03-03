import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'staff-documents'
const MAX_SIZE_MB = 15
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]

const DOC_TYPES = ['signed_contract', 'id_document', 'other'] as const

/** GET – Dokumente eines Mitarbeiters auflisten */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isStaffManager } = await getAdminContext()
  if (!isStaffManager) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id: staffId } = await params
  if (!staffId) return NextResponse.json({ error: 'Staff-ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: staff } = await admin.from('staff').select('id').eq('id', staffId).single()
  if (!staff) return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 })

  const { data, error } = await admin
    .from('staff_documents')
    .select('id, document_type, file_name, file_size, mime_type, created_at')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – Dokument hochladen (z. B. eingescannten Vertrag) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isStaffManager } = await getAdminContext()
  if (!isStaffManager) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id: staffId } = await params
  if (!staffId) return NextResponse.json({ error: 'Staff-ID fehlt' }, { status: 400 })

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Kein Formular-Daten' }, { status: 400 })

  const documentType = (formData.get('document_type') as string) || 'signed_contract'
  if (!DOC_TYPES.includes(documentType as typeof DOC_TYPES[number])) {
    return NextResponse.json({
      error: 'document_type muss sein: signed_contract, id_document, other',
    }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Keine Datei gesendet' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Datei zu groß. Max. ${MAX_SIZE_MB} MB.` }, { status: 400 })
  }

  const mime = file.type?.toLowerCase()
  if (!mime || !ALLOWED_TYPES.includes(mime)) {
    return NextResponse.json({ error: 'Nur PDF, JPEG, PNG, WebP erlaubt.' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: staff } = await admin.from('staff').select('id').eq('id', staffId).single()
  if (!staff) return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 })

  const ext = file.name.split('.').pop()?.toLowerCase() || (mime.includes('pdf') ? 'pdf' : 'jpg')
  const safeExt = ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'pdf'
  const fileName = `${staffId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[staff-documents upload]', uploadError)
    if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: `Storage-Bucket "${BUCKET}" fehlt. Migration migration-staff-documents-and-contract-type.sql ausführen.` },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: uploadError.message || 'Upload fehlgeschlagen' }, { status: 500 })
  }

  const { data, error } = await admin
    .from('staff_documents')
    .insert({
      staff_id: staffId,
      document_type: documentType,
      file_path: fileName,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    })
    .select()
    .single()

  if (error) {
    await admin.storage.from(BUCKET).remove([fileName]).catch(() => {})
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
