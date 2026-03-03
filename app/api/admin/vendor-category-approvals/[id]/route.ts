import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminContext } from '@/lib/admin-auth'

/** PATCH – Approval-Status setzen (APPROVED / REJECTED / REVOKED) */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const ctx = await getAdminContext()
  if (!ctx.isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await Promise.resolve(context.params).then((p) => p ?? {})
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await request.json().catch(() => ({}))
  const { status, review_notes } = body

  if (!['APPROVED', 'REJECTED', 'REVOKED'].includes(status)) {
    return NextResponse.json({ error: 'status muss APPROVED, REJECTED oder REVOKED sein' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const updates: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by_admin_id: ctx.user?.id ?? null,
  }
  if (typeof review_notes === 'string') updates.review_notes = review_notes.trim() || null

  const { data, error } = await admin
    .schema('admin')
    .from('vendor_category_approvals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
