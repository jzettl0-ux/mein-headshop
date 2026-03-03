import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'staff-documents'

/** GET – Download-Link (signed URL) für ein Mitarbeiter-Dokument */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { isStaffManager } = await getAdminContext()
  if (!isStaffManager) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id: staffId, docId } = await params
  if (!staffId || !docId) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: row, error: fetchError } = await admin
    .from('staff_documents')
    .select('id, file_path, file_name, mime_type')
    .eq('id', docId)
    .eq('staff_id', staffId)
    .single()

  if (fetchError || !row) return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 })

  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(row.file_path, 60)

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: signError?.message || 'Download-Link konnte nicht erstellt werden' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl, file_name: row.file_name })
}
