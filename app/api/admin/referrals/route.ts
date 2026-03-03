import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Übersicht Empfehlungsprogramm: Anzahl gewonnener Neukunden, Liste der Referrals */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data: referrals } = await admin
    .from('referrals')
    .select('id, referrer_user_id, referral_code, referred_email, referred_user_id, order_id, status, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const total = referrals?.length ?? 0
  const completed = referrals?.filter((r) => r.status === 'completed').length ?? 0
  const pending = referrals?.filter((r) => r.status === 'pending').length ?? 0

  const referrerIds = [...new Set((referrals ?? []).map((r) => r.referrer_user_id).filter(Boolean))]
  const emailByUserId: Record<string, string> = {}
  if (referrerIds.length > 0) {
    const { data: orders } = await admin
      .from('orders')
      .select('user_id, customer_email')
      .in('user_id', referrerIds)
      .order('created_at', { ascending: false })
    const seen = new Set<string>()
    for (const o of orders ?? []) {
      const uid = o.user_id as string
      if (uid && !seen.has(uid)) {
        seen.add(uid)
        emailByUserId[uid] = (o.customer_email as string) ?? ''
      }
    }
  }

  const list = (referrals ?? []).map((r) => ({
    id: r.id,
    referrer_user_id: r.referrer_user_id,
    referrer_email: emailByUserId[r.referrer_user_id] ?? null,
    referral_code: r.referral_code,
    referred_email: r.referred_email,
    referred_user_id: r.referred_user_id,
    order_id: r.order_id,
    status: r.status,
    created_at: r.created_at,
    completed_at: r.completed_at,
  }))

  return NextResponse.json({
    total,
    completed,
    pending,
    referrals: list,
  })
}
