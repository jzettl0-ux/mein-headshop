import { NextResponse } from 'next/server'
import { getInfluencerContext } from '@/lib/influencer-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Dashboard-Kacheln: Umsatz, Provision, Klicks + Sales-Chart (letzte 30 Tage) */
export async function GET() {
  const { influencer, isInfluencer } = await getInfluencerContext()
  if (!isInfluencer || !influencer) {
    return NextResponse.json({ error: 'Nicht als Influencer angemeldet' }, { status: 403 })
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()

  const { data: codes } = await admin
    .from('discount_codes')
    .select('code')
    .eq('influencer_id', influencer.id)
  const codeList = (codes ?? []).map((r) => (r as { code: string }).code)
  if (codeList.length === 0) {
    const revenue = 0
    const commission = 0
    const { count: clicks } = await admin.from('influencer_clicks').select('id', { count: 'exact', head: true }).eq('influencer_id', influencer.id)
    const salesByDay: { date: string; total: number }[] = Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      return { date: d.toISOString().slice(0, 10), total: 0 }
    })
    return NextResponse.json({
      revenue,
      commission,
      clicks: clicks ?? 0,
      commission_rate: influencer.commission_rate,
      sales_by_day: salesByDay,
    })
  }

  const { data: orders } = await admin
    .from('orders')
    .select('id, total, created_at')
    .eq('payment_status', 'paid')
    .in('discount_code', codeList)

  const revenue = (orders ?? []).reduce((sum, o) => sum + Number(o.total ?? 0), 0)
  const commission = (revenue * (influencer.commission_rate / 100))

  const { count: clicks } = await admin
    .from('influencer_clicks')
    .select('id', { count: 'exact', head: true })
    .eq('influencer_id', influencer.id)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const byDay: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i)
    byDay[d.toISOString().slice(0, 10)] = 0
  }
  for (const o of orders ?? []) {
    const date = (o.created_at as string)?.slice(0, 10)
    if (date && date in byDay) byDay[date] += Number(o.total ?? 0)
  }
  const salesByDay = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }))

  return NextResponse.json({
    revenue: Math.round(revenue * 100) / 100,
    commission: Math.round(commission * 100) / 100,
    clicks: clicks ?? 0,
    commission_rate: influencer.commission_rate,
    sales_by_day: salesByDay,
  })
}
