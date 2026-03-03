import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** PATCH – Dokumenten-Review (Maker-Checker): approve/reject mit Notizen */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { isAdmin, user } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { docId } = await params
  if (!docId) return NextResponse.json({ error: 'Dokument-ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const status = body.review_status
  if (!status || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'review_status muss approved oder rejected sein' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const updates: Record<string, unknown> = {
    review_status: status,
    review_notes: typeof body.review_notes === 'string' ? body.review_notes.trim().slice(0, 2000) || null : null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user?.id ?? null,
  }

  const { data, error } = await admin
    .from('vendor_kyb_documents')
    .update(updates)
    .eq('id', docId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
