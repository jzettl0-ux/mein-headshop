import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'staff-documents'

/** DELETE – Dokument eines Mitarbeiters löschen */
export async function DELETE(
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
    .select('id, file_path')
    .eq('id', docId)
    .eq('staff_id', staffId)
    .single()

  if (fetchError || !row) return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 })

  const { error: deleteError } = await admin.from('staff_documents').delete().eq('id', docId)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  await admin.storage.from(BUCKET).remove([row.file_path]).catch(() => {})

  return NextResponse.json({ ok: true })
}
