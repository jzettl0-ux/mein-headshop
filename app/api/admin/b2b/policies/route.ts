import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Policies für ein B2B-Konto */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const b2bAccountId = searchParams.get('b2b_account_id')
  if (!b2bAccountId) return NextResponse.json({ error: 'b2b_account_id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('b2b')
    .from('purchasing_policies')
    .select('*, product_categories(id, name, slug)')
    .eq('b2b_account_id', b2bAccountId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – Neue Policy */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { b2b_account_id, policy_type, policy_value, target_category_id, target_vendor_id, action_on_violation } = body

  if (!b2b_account_id || !policy_type) {
    return NextResponse.json({ error: 'b2b_account_id und policy_type erforderlich' }, { status: 400 })
  }

  const payload: Record<string, unknown> = {
    b2b_account_id,
    policy_type,
    action_on_violation: action_on_violation || 'REQUIRE_APPROVAL',
  }

  if (policy_type === 'ORDER_LIMIT' && policy_value != null) {
    payload.policy_value = Number(policy_value)
    payload.target_category_id = null
    payload.target_vendor_id = null
  } else if (policy_type === 'RESTRICTED_CATEGORY' && target_category_id) {
    payload.target_category_id = target_category_id
    payload.policy_value = null
    payload.target_vendor_id = null
  } else if (policy_type === 'PREFERRED_VENDOR' && target_vendor_id) {
    payload.target_vendor_id = target_vendor_id
    payload.policy_value = null
    payload.target_category_id = null
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin.schema('b2b').from('purchasing_policies').insert(payload as never).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
