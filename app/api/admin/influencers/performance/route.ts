import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Alle Influencer mit Performance (Umsatz, Provision, Auszahlungen) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data: influencers } = await admin.from('influencers').select('id, name, slug, commission_rate, user_id').order('name')

  const result = await Promise.all(
    (influencers ?? []).map(async (inf) => {
      const { data: codes } = await admin.from('discount_codes').select('code').eq('influencer_id', inf.id)
      const codeList = (codes ?? []).map((r) => (r as { code: string }).code)

      let revenue = 0
      if (codeList.length > 0) {
        const { data: orders } = await admin
          .from('orders')
          .select('total')
          .eq('payment_status', 'paid')
          .in('discount_code', codeList)
        revenue = (orders ?? []).reduce((sum, o) => sum + Number(o.total ?? 0), 0)
      }
      const commissionRate = Number(inf.commission_rate) ?? 10
      const commission = revenue * (commissionRate / 100)

      const { data: payouts } = await admin
        .from('influencer_payouts')
        .select('id, amount, status, requested_at, paid_at, created_at')
        .eq('influencer_id', inf.id)
        .order('created_at', { ascending: false })
      const paidSum = (payouts ?? []).filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount ?? 0), 0)
      const openBalance = Math.max(0, commission - paidSum)
      const requested = (payouts ?? []).filter((p) => p.status === 'requested')

      return {
        id: inf.id,
        name: inf.name,
        slug: inf.slug,
        commission_rate: commissionRate,
        user_id: inf.user_id,
        revenue: Math.round(revenue * 100) / 100,
        commission: Math.round(commission * 100) / 100,
        open_balance: Math.round(openBalance * 100) / 100,
        payouts: (payouts ?? []).map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          status: p.status,
          requested_at: p.requested_at,
          paid_at: p.paid_at,
          created_at: p.created_at,
        })),
        requested_payouts: requested.map((p) => ({ id: p.id, amount: Number(p.amount), requested_at: p.requested_at })),
      }
    })
  )

  return NextResponse.json({ influencers: result })
}
