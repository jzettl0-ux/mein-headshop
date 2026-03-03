import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const TOP_PRODUCTS_LIMIT = 8
const TREND_THRESHOLD_UP = 0.1   // 10% growth = trending
const TREND_THRESHOLD_DOWN = -0.1 // -10% = declining

function formatMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * GET – Saisonale Trends & Produkt-Analyse.
 * Query: ?year=2024 – Jahr für saisonale Übersicht. Ohne year = aktuelles Jahr.
 * Liefert: Top-Produkte pro Monat, Trend pro Produkt (letzte 6 Monate), Einkaufs-Empfehlungen.
 */
export async function GET(req: Request) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const yearParam = searchParams.get('year')
  const year = yearParam && /^\d{4}$/.test(yearParam)
    ? Math.min(9999, Math.max(2000, parseInt(yearParam, 10)))
    : new Date().getFullYear()

  const admin = createSupabaseAdmin()
  const now = new Date()

  // Jahr-Range für saisonale Übersicht
  const yearStart = new Date(year, 0, 1, 0, 0, 0)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

  // Letzte 6 Monate für Trend-Analyse (unabhängig vom Jahr-Filter)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0)
  const trendRangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  // Vorjahr für Saison-Erkennung
  const prevYearStart = new Date(year - 1, 0, 1, 0, 0, 0)
  const prevYearEnd = new Date(year - 1, 11, 31, 23, 59, 59, 999)

  // Produkte laden
  const { data: products } = await admin.from('products').select('id, name')
  const productList = products ?? []
  const nameById: Record<string, string> = {}
  for (const p of productList) nameById[p.id] = p.name ?? p.id

  // Bestellungen + Items für das Jahr (saisonale Übersicht)
  const { data: ordersYear } = await admin
    .from('orders')
    .select('id, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', yearStart.toISOString())
    .lte('created_at', yearEnd.toISOString())

  const orderIdsYear = (ordersYear ?? []).map((o) => o.id)
  let itemsYear: { order_id: string; product_id: string; quantity: number }[] = []
  if (orderIdsYear.length > 0) {
    const { data: items } = await admin
      .from('order_items')
      .select('order_id, product_id, quantity')
      .in('order_id', orderIdsYear)
    itemsYear = (items ?? []).filter((i) => i.product_id).map((i) => ({
      order_id: i.order_id,
      product_id: i.product_id as string,
      quantity: Number(i.quantity) || 0,
    }))
  }

  // Bestellungen + Items für Vorjahr (Saison-Erkennung)
  const { data: ordersPrevYear } = await admin
    .from('orders')
    .select('id, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', prevYearStart.toISOString())
    .lte('created_at', prevYearEnd.toISOString())

  const orderIdsPrevYear = (ordersPrevYear ?? []).map((o) => o.id)
  const orderCreatedByIdPrev: Record<string, string> = {}
  for (const o of ordersPrevYear ?? []) orderCreatedByIdPrev[o.id] = (o as { created_at?: string }).created_at ?? ''
  let itemsPrevYear: { order_id: string; product_id: string; quantity: number; created_at: string }[] = []
  if (orderIdsPrevYear.length > 0) {
    const { data: items } = await admin
      .from('order_items')
      .select('order_id, product_id, quantity')
      .in('order_id', orderIdsPrevYear)
    itemsPrevYear = (items ?? []).filter((i) => i.product_id).map((i) => ({
      order_id: i.order_id,
      product_id: i.product_id as string,
      quantity: Number(i.quantity) || 0,
      created_at: orderCreatedByIdPrev[i.order_id] ?? '',
    }))
  }

  // Bestellungen + Items für letzte 6 Monate (Trend-Analyse)
  const { data: orders6m } = await admin
    .from('orders')
    .select('id, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', sixMonthsAgo.toISOString())
    .lte('created_at', trendRangeEnd.toISOString())

  const orderIds6m = (orders6m ?? []).map((o) => o.id)
  const orderCreatedById6m: Record<string, string> = {}
  for (const o of orders6m ?? []) orderCreatedById6m[o.id] = (o as { created_at?: string }).created_at ?? ''

  let items6m: { order_id: string; product_id: string; quantity: number; created_at: string }[] = []
  if (orderIds6m.length > 0) {
    const { data: items } = await admin
      .from('order_items')
      .select('order_id, product_id, quantity')
      .in('order_id', orderIds6m)
    items6m = (items ?? []).filter((i) => i.product_id).map((i) => ({
      order_id: i.order_id,
      product_id: i.product_id as string,
      quantity: Number(i.quantity) || 0,
      created_at: orderCreatedById6m[i.order_id] ?? '',
    }))
  }

  // Saisonale Daten: salesByMonthProduct[monthKey][product_id] = quantity
  type SalesByProduct = Record<string, number>
  const salesByMonthProduct: Record<string, SalesByProduct> = {}
  for (let m = 1; m <= 12; m++) {
    salesByMonthProduct[formatMonthKey(year, m)] = {}
  }

  const totalByProduct: Record<string, number> = {}
  for (const it of itemsYear) {
    const order = ordersYear?.find((o) => o.id === it.order_id)
    if (!order) continue
    const d = new Date(order.created_at)
    const key = formatMonthKey(d.getFullYear(), d.getMonth() + 1)
    if (!salesByMonthProduct[key]) salesByMonthProduct[key] = {}
    salesByMonthProduct[key][it.product_id] = (salesByMonthProduct[key][it.product_id] ?? 0) + it.quantity
    totalByProduct[it.product_id] = (totalByProduct[it.product_id] ?? 0) + it.quantity
  }

  const topProductIds = Object.entries(totalByProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_PRODUCTS_LIMIT)
    .map(([id]) => id)

  const seasonal_data = Object.entries(salesByMonthProduct)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, byProduct]) => {
      const products: Record<string, number> = {}
      for (const pid of topProductIds) {
        const qty = byProduct[pid] ?? 0
        if (qty > 0) products[pid] = qty
      }
      return { month: monthKey, products }
    })

  const top_products = topProductIds.map((id) => ({
    id,
    name: nameById[id] ?? id,
    total_sold: totalByProduct[id] ?? 0,
  }))

  // Vorjahr: Verkäufe pro Produkt pro Monat (für Saison-Erkennung)
  const prevYearByMonthProduct: Record<string, SalesByProduct> = {}
  for (let m = 1; m <= 12; m++) {
    prevYearByMonthProduct[formatMonthKey(year - 1, m)] = {}
  }
  for (const it of itemsPrevYear) {
    const d = new Date(it.created_at)
    const key = formatMonthKey(d.getFullYear(), d.getMonth() + 1)
    if (!prevYearByMonthProduct[key]) prevYearByMonthProduct[key] = {}
    prevYearByMonthProduct[key][it.product_id] = (prevYearByMonthProduct[key][it.product_id] ?? 0) + it.quantity
  }

  // Letzte 6 Monate pro Produkt (für Trend & Line Chart)
  const sales6mByProductMonth: Record<string, Record<string, number>> = {}
  for (const it of items6m) {
    const d = new Date(it.created_at)
    const key = formatMonthKey(d.getFullYear(), d.getMonth() + 1)
    if (!sales6mByProductMonth[it.product_id]) sales6mByProductMonth[it.product_id] = {}
    sales6mByProductMonth[it.product_id][key] = (sales6mByProductMonth[it.product_id][key] ?? 0) + it.quantity
  }

  const sixMonthKeys: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    sixMonthKeys.push(formatMonthKey(d.getFullYear(), d.getMonth() + 1))
  }

  const product_trends = productList.map((p) => {
    const byMonth = sales6mByProductMonth[p.id] ?? {}
    const last6Months = sixMonthKeys.map((monthKey) => ({
      month: monthKey,
      label: (() => {
        const [y, m] = monthKey.split('-')
        const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1)
        return d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
      })(),
      sales: byMonth[monthKey] ?? 0,
    }))

    const currentMonth = sixMonthKeys[sixMonthKeys.length - 1]
    const prevMonth = sixMonthKeys[sixMonthKeys.length - 2]
    const currentSales = byMonth[currentMonth] ?? 0
    const prevSales = prevMonth ? (byMonth[prevMonth] ?? 0) : 0

    let growth_rate = 0
    if (prevSales > 0) growth_rate = (currentSales - prevSales) / prevSales
    else if (currentSales > 0) growth_rate = 1

    let trend: 'trending' | 'stable' | 'declining' = 'stable'
    if (growth_rate >= TREND_THRESHOLD_UP) trend = 'trending'
    else if (growth_rate <= TREND_THRESHOLD_DOWN) trend = 'declining'

    return {
      product_id: p.id,
      name: nameById[p.id] ?? p.id,
      last_6_months: last6Months,
      growth_rate: Math.round(growth_rate * 100) / 100,
      trend,
    }
  }).filter((t) => t.last_6_months.some((m) => m.sales > 0) || topProductIds.includes(t.product_id))

  const nextMonth1Based = now.getMonth() + 2
  const nextMonthNum = nextMonth1Based <= 12 ? nextMonth1Based : 1
  const nextMonthPrevYear = formatMonthKey(year - 1, nextMonthNum)

  const insights: { product_id: string; product_name: string; reason: string }[] = []

  for (const t of product_trends) {
    const pid = t.product_id
    const prevYearNext = prevYearByMonthProduct[nextMonthPrevYear]?.[pid] ?? 0
    const prevYearCurr = prevYearByMonthProduct[formatMonthKey(year - 1, now.getMonth() + 1)]?.[pid] ?? 0

    const seasonApproaching = prevYearNext > prevYearCurr && prevYearNext > 0
    if (t.trend === 'trending' && seasonApproaching) {
      insights.push({
        product_id: pid,
        product_name: t.name,
        reason: `Positiver Trend und Saison für dieses Produkt steht bevor (Vorjahr: höhere Verkäufe im kommenden Monat). Empfehlung: rechtzeitig nachbestellen.`,
      })
    } else if (t.trend === 'trending' && prevYearNext > 0) {
      insights.push({
        product_id: pid,
        product_name: t.name,
        reason: `Aktuell steigende Verkäufe. Im Vorjahr ebenfalls Nachfrage im kommenden Monat.`,
      })
    }
  }

  return NextResponse.json({
    year,
    seasonal_data,
    top_products,
    product_trends,
    insights,
    six_month_keys: sixMonthKeys,
  })
}
