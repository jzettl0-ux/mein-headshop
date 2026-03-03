import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const DAYS_LOOKBACK = 30

/**
 * GET – Saisonale Trends: kommende Events, Einkaufsempfehlungen basierend auf
 * Verkäufen der letzten 30 Tage × growth_factor → zusätzliche Bestellmenge.
 * Chart: erwartete Verkaufsspitzen über die nächsten 3 Monate.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const now = new Date()
  const currentYear = now.getFullYear()
  const since = new Date(now)
  since.setDate(since.getDate() - DAYS_LOOKBACK)

  let events: { id: string; name: string; event_month: number; event_day: number; expected_growth_factor: number; notes?: string }[] = []
  try {
    const { data: rows } = await admin.from('seasonal_events').select('id, name, event_month, event_day, expected_growth_factor, notes')
    events = (rows ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      event_month: Number(r.event_month) || 1,
      event_day: Number(r.event_day) || 1,
      expected_growth_factor: Number(r.expected_growth_factor) || 1,
      notes: r.notes ?? undefined,
    }))
  } catch {
    // Tabelle optional
  }

  const { data: products } = await admin.from('products').select('id, name, stock, cost_price')
  const productList = products ?? []
  const costByProductId: Record<string, number> = {}
  const stockByProductId: Record<string, number> = {}
  const nameByProductId: Record<string, string> = {}
  for (const p of productList) {
    costByProductId[p.id] = Number(p.cost_price) ?? 0
    stockByProductId[p.id] = Math.max(0, Number(p.stock) ?? 0)
    nameByProductId[p.id] = p.name ?? ''
  }

  const { data: ordersLast30 } = await admin
    .from('orders')
    .select('id')
    .eq('payment_status', 'paid')
    .gte('created_at', since.toISOString())
  const orderIds30 = (ordersLast30 ?? []).map((o) => o.id)
  let items30: { product_id: string; quantity: number }[] = []
  if (orderIds30.length > 0) {
    const { data: orderItems } = await admin
      .from('order_items')
      .select('product_id, quantity')
      .in('order_id', orderIds30)
    items30 = (orderItems ?? []).filter((i) => i.product_id).map((i) => ({ product_id: i.product_id as string, quantity: Number(i.quantity) || 0 }))
  }
  const soldLast30ByProduct: Record<string, number> = {}
  for (const it of items30) {
    soldLast30ByProduct[it.product_id] = (soldLast30ByProduct[it.product_id] ?? 0) + it.quantity
  }

  let revenueLast30 = 0
  if (orderIds30.length > 0) {
    const { data: ordTotals } = await admin.from('orders').select('total').in('id', orderIds30)
    revenueLast30 = (ordTotals ?? []).reduce((s, o) => s + (Number(o.total) ?? 0), 0)
  }
  revenueLast30 = Math.round(revenueLast30 * 100) / 100

  const eventsWithRecommendations: {
    id: string
    name: string
    event_month: number
    event_day: number
    expected_growth_factor: number
    notes?: string
    expected_cogs_eur: number
    recommendations: { product_id: string; product_name: string; current_stock: number; sold_last_30: number; expected_demand: number; order_quantity: number; cost_eur: number }[]
  }[] = []

  for (const ev of events) {
    const growth_factor = ev.expected_growth_factor
    const recommendations: { product_id: string; product_name: string; current_stock: number; sold_last_30: number; expected_demand: number; order_quantity: number; cost_eur: number }[] = []
    let expected_cogs_eur = 0
    for (const p of productList) {
      const soldLast30 = soldLast30ByProduct[p.id] ?? 0
      const expectedDemand = Math.ceil(soldLast30 * growth_factor)
      const stock = stockByProductId[p.id] ?? 0
      const orderQty = Math.max(0, expectedDemand - stock)
      if (orderQty > 0) {
        const costEur = orderQty * (costByProductId[p.id] ?? 0)
        expected_cogs_eur += costEur
        recommendations.push({
          product_id: p.id,
          product_name: nameByProductId[p.id] ?? p.id,
          current_stock: stock,
          sold_last_30: soldLast30,
          expected_demand: expectedDemand,
          order_quantity: orderQty,
          cost_eur: Math.round(costEur * 100) / 100,
        })
      }
    }
    eventsWithRecommendations.push({
      id: ev.id,
      name: ev.name,
      event_month: ev.event_month,
      event_day: ev.event_day,
      expected_growth_factor: growth_factor,
      notes: ev.notes,
      expected_cogs_eur: Math.round(expected_cogs_eur * 100) / 100,
      recommendations,
    })
  }

  const chartData: { month: string; monthKey: string; actual: number; projected: number | null; isEvent: boolean }[] = []
  for (let i = 2; i >= 0; i--) {
    const d = new Date(currentYear, now.getMonth() - i, 1)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const { data: ords } = await admin
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid')
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString())
    const actual = (ords ?? []).reduce((s, o) => s + (Number(o.total) ?? 0), 0)
    const eventInMonth = events.find((e) => e.event_month === d.getMonth() + 1)
    chartData.push({
      month: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
      monthKey,
      actual: Math.round(actual * 100) / 100,
      projected: null,
      isEvent: !!eventInMonth,
    })
  }
  for (let i = 1; i <= 3; i++) {
    const d = new Date(currentYear, now.getMonth() + i, 1)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const ev = events.find((e) => e.event_month === d.getMonth() + 1)
    const growth = ev ? ev.expected_growth_factor : 1
    const baselineMonthly = (revenueLast30 / DAYS_LOOKBACK) * daysInMonth
    const projected = Math.round(baselineMonthly * growth * 100) / 100
    chartData.push({
      month: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
      monthKey,
      actual: 0,
      projected,
      isEvent: !!ev,
    })
  }

  return NextResponse.json({
    events: eventsWithRecommendations,
    chart_data: chartData,
    seasonal_expected_cogs_eur: eventsWithRecommendations.reduce((s, e) => s + e.expected_cogs_eur, 0),
  })
}
