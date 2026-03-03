import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Alle ausstehenden B2B-Freigaben */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data: approvals, error } = await admin
    .schema('b2b')
    .from('order_approvals')
    .select('approval_id, order_id, b2b_account_id, requested_by_user_id, violated_policy_id, status, created_at')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = approvals ?? []
  if (rows.length === 0) return NextResponse.json([])

  const orderIds = [...new Set(rows.map((r: { order_id: string }) => r.order_id))]
  const b2bIds = [...new Set(rows.map((r: { b2b_account_id: string }) => r.b2b_account_id))]
  const policyIds = [...new Set(rows.map((r: { violated_policy_id?: string }) => r.violated_policy_id).filter(Boolean))]

  const { data: orders } = await admin.from('orders').select('id, order_number, customer_name, customer_email, total, status').in('id', orderIds)
  const { data: accounts } = await admin.schema('b2b').from('business_accounts').select('id, company_name').in('id', b2bIds)
  const { data: policies } = policyIds.length > 0
    ? await admin.schema('b2b').from('purchasing_policies').select('policy_id, policy_type, policy_value, target_category_id, target_vendor_id, action_on_violation').in('policy_id', policyIds)
    : { data: [] }

  const orderMap = new Map((orders ?? []).map((o: { id: string }) => [o.id, o]))
  const accountMap = new Map((accounts ?? []).map((a: { id: string }) => [a.id, a]))
  const policyMap = new Map((policies ?? []).map((p: { policy_id: string }) => [p.policy_id, p]))

  const result = rows.map((r: Record<string, unknown>) => ({
    ...r,
    orders: orderMap.get(r.order_id as string) ?? null,
    business_accounts: accountMap.get(r.b2b_account_id as string) ?? null,
    purchasing_policies: r.violated_policy_id ? [policyMap.get(r.violated_policy_id as string)].filter(Boolean) : [],
  }))

  return NextResponse.json(result)
}
