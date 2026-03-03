import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – PunchOut-Sessions (SAP Ariba, Coupa) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ sessions: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: sessions, error } = await admin
      .schema('enterprise_b2b')
      .from('punchout_sessions')
      .select('session_id, b2b_account_id, procurement_system, status, return_url, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ sessions: [] }, { status: 200 })

    const accountIds = [...new Set((sessions ?? []).map((s) => (s as { b2b_account_id: string }).b2b_account_id))]
    let byId = new Map<string, string>()
    if (accountIds.length > 0) {
      const { data: accounts } = await admin.schema('b2b').from('business_accounts').select('id, legal_name').in('id', accountIds)
      byId = new Map((accounts ?? []).map((a) => [a.id, (a as { legal_name?: string }).legal_name ?? a.id]))
    }

    const enriched = (sessions ?? []).map((s) => ({
      ...s,
      b2b_account_name: byId.get(s.b2b_account_id) ?? '–',
    }))

    return NextResponse.json({ sessions: enriched })
  } catch {
    return NextResponse.json({ sessions: [] }, { status: 200 })
  }
}
