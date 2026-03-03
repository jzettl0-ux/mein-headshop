import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Signed URL zum Anzeigen eines KYB-Dokuments (60 Sekunden gültig) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { docId } = await params
  if (!docId) return NextResponse.json({ error: 'Dokument-ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: doc, error: docError } = await admin
    .from('vendor_kyb_documents')
    .select('file_path')
    .eq('id', docId)
    .single()

  if (docError || !doc?.file_path) {
    return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 })
  }

  const { data: signed, error } = await admin.storage
    .from('vendor-kyb-documents')
    .createSignedUrl(doc.file_path, 60)

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: 'URL konnte nicht erzeugt werden' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl })
}
