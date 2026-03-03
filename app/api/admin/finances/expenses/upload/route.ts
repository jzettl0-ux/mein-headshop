import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'expense-invoices'
const MAX_SIZE_MB = 10
const ALLOWED_TYPES = ['application/pdf']

/**
 * POST – Admin: Rechnungs-PDF für eine Ausgabe hochladen.
 * Speichert im Storage-Bucket "expense-invoices" und gibt die öffentliche URL zurück.
 * Im Supabase Dashboard unter Storage einen Bucket "expense-invoices" anlegen (Public, wenn Rechnungen per Link abrufbar sein sollen).
 */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei gesendet' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Datei zu groß. Max. ${MAX_SIZE_MB} MB.` },
      { status: 400 }
    )
  }

  const type = file.type?.toLowerCase()
  if (!type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json(
      { error: 'Nur PDF-Dateien erlaubt.' },
      { status: 400 }
    )
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
  const fileName = `${Date.now()}-${sanitizedName || 'rechnung.pdf'}`

  const admin = createSupabaseAdmin()
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(fileName, file, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: `Storage-Bucket "${BUCKET}" fehlt. Im Supabase Dashboard unter Storage einen öffentlichen Bucket "${BUCKET}" anlegen.` },
        { status: 503 }
      )
    }
    console.error('Expense invoice upload error:', uploadError)
    return NextResponse.json({ error: uploadError.message || 'Upload fehlgeschlagen' }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(fileName)
  return NextResponse.json({ url: publicUrl, path: fileName })
}
