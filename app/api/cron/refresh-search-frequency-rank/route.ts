/**
 * GET /api/cron/refresh-search-frequency-rank?secret=CRON_SECRET
 * Aggregiert advanced_analytics.search_clicks in search_frequency_rank (Click Share).
 * Pro Suchbegriff + Kalenderwoche: Top-3-Produkte nach Klicks, click_share_1/2/3.
 * Vercel Cron: z. B. täglich um 6:00.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** ISO-Woche (Montag = Start) als YYYY-MM-DD */
function getWeekStart(d: Date): string {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d)
  mon.setDate(diff)
  return mon.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = process.env.CRON_SECRET
  if (secret && searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()

  const { data: clicks, error: clicksError } = await admin
    .schema('advanced_analytics')
    .from('search_clicks')
    .select('search_term, product_id, clicked_at')

  if (clicksError) {
    console.error('[refresh-search-frequency-rank] search_clicks:', clicksError.message)
    return NextResponse.json({ ok: true, updated: 0, message: 'Tabelle search_clicks nicht vorhanden oder leer.' })
  }

  if (!clicks?.length) {
    return NextResponse.json({ ok: true, updated: 0, message: 'Keine Klicks.' })
  }

  const byTermWeek = new Map<string, Map<string, number>>()
  for (const row of clicks as { search_term: string; product_id: string; clicked_at: string }[]) {
    const week = getWeekStart(new Date(row.clicked_at))
    const key = `${row.search_term}\t${week}`
    if (!byTermWeek.has(key)) byTermWeek.set(key, new Map())
    const productCount = byTermWeek.get(key)!
    productCount.set(row.product_id, (productCount.get(row.product_id) ?? 0) + 1)
  }

  let updated = 0
  for (const [key, productCounts] of byTermWeek) {
    const [search_term, calculation_week] = key.split('\t')
    const total = [...productCounts.values()].reduce((a, b) => a + b, 0)
    if (total === 0) continue

    const sorted = [...productCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    const top_product_id_1 = sorted[0]?.[0] ?? null
    const top_product_id_2 = sorted[1]?.[0] ?? null
    const top_product_id_3 = sorted[2]?.[0] ?? null
    const click_share_1 = top_product_id_1 ? (sorted[0]![1] / total) : null
    const click_share_2 = top_product_id_2 ? (sorted[1]![1] / total) : null
    const click_share_3 = top_product_id_3 ? (sorted[2]![1] / total) : null

    const payload = {
      search_term,
      calculation_week,
      platform_rank: 1,
      top_product_id_1,
      click_share_1,
      conversion_share_1: null,
      top_product_id_2,
      click_share_2,
      top_product_id_3,
      click_share_3,
    }

    const { error } = await admin
      .schema('advanced_analytics')
      .from('search_frequency_rank')
      .upsert(payload, {
        onConflict: 'search_term,calculation_week',
        ignoreDuplicates: false,
      })

    if (!error) updated++
  }

  return NextResponse.json({
    ok: true,
    updated,
    termWeeks: byTermWeek.size,
    message: `Search Frequency Rank: ${updated} Einträge aktualisiert.`,
  })
}
