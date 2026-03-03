import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'vendor-kyb-documents'
const MAX_SIZE_MB = 10
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]

const DOC_TYPES = ['handelsregister', 'ust_bescheinigung', 'id_pass', 'id_id_card', 'company_extract', 'other'] as const

/** POST – KYB-Dokument hochladen (Storage + DB) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id: vendorId } = await params
  if (!vendorId) return NextResponse.json({ error: 'Vendor-ID fehlt' }, { status: 400 })

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Kein Formular-Daten' }, { status: 400 })

  const documentType = formData.get('document_type') as string | null
  const file = formData.get('file') as File | null

  if (!documentType || !DOC_TYPES.includes(documentType as typeof DOC_TYPES[number])) {
    return NextResponse.json({
      error: 'document_type erforderlich: handelsregister, ust_bescheinigung, id_pass, id_id_card, company_extract, other',
    }, { status: 400 })
  }

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

  const ext = file.name.split('.').pop()?.toLowerCase() || (mime.includes('pdf') ? 'pdf' : 'jpg')
  const safeExt = ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'pdf'
  const fileName = `${vendorId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`

  const admin = createSupabaseAdmin()

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[vendor-kyb-upload]', uploadError)
    if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: `Storage-Bucket "${BUCKET}" fehlt. Migration migration-vendors-kyb.sql ausführen.` },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: uploadError.message || 'Upload fehlgeschlagen' }, { status: 500 })
  }

  const { data, error } = await admin
    .from('vendor_kyb_documents')
    .insert({
      vendor_id: vendorId,
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
