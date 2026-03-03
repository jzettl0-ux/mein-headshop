import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminContext, requireAdmin } from '@/lib/admin-auth'

/** POST – Freigabe ablehnen */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await Promise.resolve(context.params)
  if (!id) return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const reason = body.reason ?? null

  const admin = createSupabaseAdmin()

  const { data: approval, error: appErr } = await admin
    .schema('b2b')
    .from('order_approvals')
    .select('approval_id, order_id, status')
    .eq('approval_id', id)
    .single()

  if (appErr || !approval || approval.status !== 'PENDING') {
    return NextResponse.json({ error: 'Freigabe nicht gefunden oder bereits bearbeitet' }, { status: 404 })
  }

  await admin.from('orders').update({
    status: 'approval_rejected',
    order_note: reason ? `B2B-Freigabe abgelehnt: ${reason}` : 'B2B-Freigabe abgelehnt',
  }).eq('id', approval.order_id)

  await admin.schema('b2b').from('order_approvals').update({
    status: 'REJECTED',
    reviewed_by_admin_id: (await getAdminContext()).user?.id ?? null,
    reviewed_at: new Date().toISOString(),
  }).eq('approval_id', id)

  return NextResponse.json({ ok: true, message: 'Freigabe abgelehnt' })
}
