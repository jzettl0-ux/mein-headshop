import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getLoyaltySettings } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

/** GET – Loyalty-Umsatzstatistik für Admin-Dashboard */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const settings = await getLoyaltySettings(admin)
  const pointsPerEur = Math.max(1, settings.points_per_eur_discount)

  // Zeiträume: aktueller Monat, letzter Monat, Gesamt
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  // Bestellungen mit Loyalty-Nutzung (status != cancelled)
  const { data: ordersAll } = await admin
    .from('orders')
    .select('id, total, status, loyalty_points_redeemed, loyalty_tier_discount_amount, created_at, user_id')
    .neq('status', 'cancelled')

  const orders = (ordersAll ?? []).filter((o) => o.status !== 'cancelled')

  // Nur bezahlte Bestellungen (typischerweise paid/delivered/shipped/processing)
  const paidStatuses = ['paid', 'processing', 'shipped', 'delivered']
  const paidOrders = orders.filter((o) => paidStatuses.includes(String(o.status ?? '')))

  const toNum = (v: unknown) => (v != null ? Number(v) : 0)

  const withLoyalty = paidOrders.filter(
    (o) => toNum(o.loyalty_points_redeemed) > 0 || toNum(o.loyalty_tier_discount_amount) > 0
  )

  const totalRevenue = paidOrders.reduce((sum, o) => sum + toNum(o.total), 0)
  const revenueWithLoyalty = withLoyalty.reduce((sum, o) => sum + toNum(o.total), 0)
  const totalPointsRedeemedEuro = paidOrders.reduce(
    (sum, o) => sum + toNum(o.loyalty_points_redeemed) / pointsPerEur,
    0
  )
  const totalTierDiscountEuro = paidOrders.reduce(
    (sum, o) => sum + toNum(o.loyalty_tier_discount_amount),
    0
  )

  const thisMonth = paidOrders.filter((o) => (o.created_at ?? '') >= thisMonthStart)
  const lastMonth = paidOrders.filter(
    (o) => (o.created_at ?? '') >= lastMonthStart && (o.created_at ?? '') <= lastMonthEnd
  )

  const thisMonthRevenue = thisMonth.reduce((sum, o) => sum + toNum(o.total), 0)
  const thisMonthWithLoyalty = thisMonth.filter(
    (o) => toNum(o.loyalty_points_redeemed) > 0 || toNum(o.loyalty_tier_discount_amount) > 0
  )
  const thisMonthLoyaltyRevenue = thisMonthWithLoyalty.reduce(
    (sum, o) => sum + toNum(o.total),
    0
  )
  const thisMonthPointsEuro = thisMonth.reduce(
    (sum, o) => sum + toNum(o.loyalty_points_redeemed) / pointsPerEur,
    0
  )
  const thisMonthTierEuro = thisMonth.reduce(
    (sum, o) => sum + toNum(o.loyalty_tier_discount_amount),
    0
  )

  // Tier-Verteilung (loyalty_accounts)
  const { data: tierCounts } = await admin
    .from('loyalty_accounts')
    .select('tier')

  const tierDist: Record<string, number> = { bronze: 0, silver: 0, gold: 0 }
  for (const r of tierCounts ?? []) {
    const t = String(r?.tier ?? 'bronze')
    if (t in tierDist) tierDist[t] += 1
  }

  // Punkte-Vergabe (order) in Transaktionen
  const { data: pointsGiven } = await admin
    .from('loyalty_transactions')
    .select('amount')
    .eq('reason', 'order')

  const totalPointsGiven = (pointsGiven ?? []).reduce((s, t) => s + toNum(t.amount), 0)

  return NextResponse.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    revenueWithLoyalty: Math.round(revenueWithLoyalty * 100) / 100,
    loyaltySharePercent: totalRevenue > 0 ? Math.round((revenueWithLoyalty / totalRevenue) * 100) : 0,
    ordersWithLoyalty: withLoyalty.length,
    totalOrdersPaid: paidOrders.length,
    totalPointsRedeemedEuro: Math.round(totalPointsRedeemedEuro * 100) / 100,
    totalTierDiscountEuro: Math.round(totalTierDiscountEuro * 100) / 100,
    totalLoyaltyDiscounts: Math.round((totalPointsRedeemedEuro + totalTierDiscountEuro) * 100) / 100,
    thisMonth: {
      revenue: Math.round(thisMonthRevenue * 100) / 100,
      loyaltyRevenue: Math.round(thisMonthLoyaltyRevenue * 100) / 100,
      loyaltySharePercent: thisMonthRevenue > 0 ? Math.round((thisMonthLoyaltyRevenue / thisMonthRevenue) * 100) : 0,
      ordersWithLoyalty: thisMonthWithLoyalty.length,
      pointsRedeemedEuro: Math.round(thisMonthPointsEuro * 100) / 100,
      tierDiscountEuro: Math.round(thisMonthTierEuro * 100) / 100,
    },
    lastMonthOrders: lastMonth.length,
    tierDistribution: tierDist,
    totalPointsGiven,
  })
}
