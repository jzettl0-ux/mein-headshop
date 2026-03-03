import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getFinanceSettings, calcTransactionFee, calcTaxReserve } from '@/lib/finance-settings'

export const dynamic = 'force-dynamic'

/**
 * GET – Lagerwert (Summe Lagerbestand × Einkaufspreis) + Cashflow nach Jahr (Einnahmen vs. Ausgaben).
 * Query: ?year=2024 – filtert auf dieses Jahr (12 Monate). Ohne year = aktuelles Jahr.
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
  let settings
  try {
    settings = await getFinanceSettings(admin)
  } catch (e) {
    console.error('finances/overview getFinanceSettings', e)
    return NextResponse.json(
      { error: 'Finanz-Einstellungen nicht geladen. Bitte migration-finance-settings.sql ausführen.' },
      { status: 500 }
    )
  }

  const now = new Date()
  const yearStart = new Date(year, 0, 1, 0, 0, 0)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

  const { data: products, error: productsErr } = await admin.from('products').select('id, stock, cost_price')
  if (productsErr) {
    console.warn('finances/overview products (z. B. cost_price fehlt):', productsErr.message)
  }
  const productsList = productsErr ? [] : (products ?? [])
  let stock_value = 0
  for (const p of productsList) {
    const stock = Math.max(0, Number(p.stock) ?? 0)
    const cost = Number(p.cost_price) ?? 0
    stock_value += stock * cost
  }

  const { data: orders } = await admin
    .from('orders')
    .select('id, total, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', yearStart.toISOString())
    .lte('created_at', yearEnd.toISOString())

  const orderIds = (orders || []).map((o) => o.id)
  let items: { order_id: string; product_id: string; quantity: number; price: number }[] = []
  if (orderIds.length > 0) {
    const { data: itemsData } = await admin
      .from('order_items')
      .select('order_id, product_id, quantity, price')
      .in('order_id', orderIds)
    items = (itemsData || []).map((i) => ({
      order_id: i.order_id,
      product_id: i.product_id ?? '',
      quantity: Number(i.quantity) || 0,
      price: Number(i.price) || 0,
    }))
  }

  const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))]
  let costByProductId: Record<string, number> = {}
  if (productIds.length > 0) {
    const { data: prods } = await admin.from('products').select('id, cost_price').in('id', productIds)
    for (const p of prods || []) {
      costByProductId[p.id] = Number(p.cost_price) ?? 0
    }
  }

  const orderTotalByOrderId: Record<string, number> = {}
  for (const o of orders || []) {
    orderTotalByOrderId[o.id] = Number(o.total) ?? 0
  }

  const byMonth: Record<string, { income: number; cogs: number; mollie_fees: number; expenses_manual: number }> = {}
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`
    byMonth[key] = { income: 0, cogs: 0, mollie_fees: 0, expenses_manual: 0 }
  }

  let expensesByMonth: Record<string, number> = {}
  try {
    const { data: expenseRows } = await admin.from('expenses').select('month_key, amount_eur')
    for (const row of expenseRows ?? []) {
      const key = String(row.month_key || '').slice(0, 7)
      if (key.length === 7) expensesByMonth[key] = (expensesByMonth[key] ?? 0) + Number(row.amount_eur ?? 0)
    }
    for (const key of Object.keys(byMonth)) {
      byMonth[key].expenses_manual = Math.round((expensesByMonth[key] ?? 0) * 100) / 100
    }
  } catch {
    // Tabelle expenses optional
  }

  for (const o of orders || []) {
    const created = new Date(o.created_at)
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = { income: 0, cogs: 0, mollie_fees: 0, expenses_manual: 0 }
    const total = orderTotalByOrderId[o.id] ?? 0
    byMonth[key].income += total
    byMonth[key].mollie_fees += calcTransactionFee(total, settings)
  }

  let revenue_ytd = 0
  for (const o of orders || []) {
    const created = new Date(o.created_at)
    if (created >= yearStart) revenue_ytd += orderTotalByOrderId[o.id] ?? 0
  }
  revenue_ytd = Math.round(revenue_ytd * 100) / 100

  let refunds_ytd = 0
  try {
    const { data: refundRows } = await admin.from('refunds').select('amount_eur, created_at')
    if (refundRows) {
      for (const r of refundRows) {
        const amt = Number(r.amount_eur) ?? 0
        const created = new Date((r as { created_at: string }).created_at)
        if (created >= yearStart && created <= yearEnd) refunds_ytd += amt
      }
    }
  } catch {
    // Tabelle refunds optional
  }
  refunds_ytd = Math.round(refunds_ytd * 100) / 100

  for (const it of items) {
    const order = orders?.find((x) => x.id === it.order_id)
    if (!order) continue
    const created = new Date(order.created_at)
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) continue
    const cost = costByProductId[it.product_id] ?? 0
    byMonth[key].cogs += cost * it.quantity
  }

  const cashflow = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => {
      const orderExpenses = v.cogs + v.mollie_fees
      const totalExp = orderExpenses + (v.expenses_manual ?? 0)
      return {
        month,
        income: Math.round(v.income * 100) / 100,
        expenses: Math.round(totalExp * 100) / 100,
        expenses_orders: Math.round(orderExpenses * 100) / 100,
        expenses_manual: Math.round((v.expenses_manual ?? 0) * 100) / 100,
        profit: Math.round((v.income - totalExp) * 100) / 100,
      }
    })

  const totalIncome = cashflow.reduce((s, c) => s + c.income, 0) - refunds_ytd
  const totalExpenses = cashflow.reduce((s, c) => s + c.expenses, 0)
  const actualProfit = totalIncome - totalExpenses
  const tax_reserve = calcTaxReserve(actualProfit, settings)
  const available_capital = actualProfit - tax_reserve

  let seasonal_expected_cogs_eur = 0
  try {
    const { data: seasonalEvents } = await admin.from('seasonal_events').select('id, expected_growth_factor')
    const since30 = new Date(now)
    since30.setDate(since30.getDate() - 30)
    const { data: ords30 } = await admin.from('orders').select('id').eq('payment_status', 'paid').gte('created_at', since30.toISOString())
    const orderIds30 = (ords30 ?? []).map((o) => o.id)
    let soldLast30ByProduct: Record<string, number> = {}
    if (orderIds30.length > 0) {
      const { data: items30 } = await admin.from('order_items').select('product_id, quantity').in('order_id', orderIds30)
      for (const it of items30 ?? []) {
        const pid = (it as { product_id?: string }).product_id
        if (pid) soldLast30ByProduct[pid] = (soldLast30ByProduct[pid] ?? 0) + (Number(it.quantity) || 0)
      }
    }
    const { data: productsAll } = await admin.from('products').select('id, stock, cost_price')
    const stockByProductId: Record<string, number> = {}
    const costByProductId: Record<string, number> = {}
    for (const p of productsAll ?? []) {
      stockByProductId[p.id] = Math.max(0, Number(p.stock) ?? 0)
      costByProductId[p.id] = Number(p.cost_price) ?? 0
    }
    for (const ev of seasonalEvents ?? []) {
      const growth = Number(ev.expected_growth_factor) || 1
      let cogs = 0
      for (const p of productsAll ?? []) {
        const sold30 = soldLast30ByProduct[p.id] ?? 0
        const expectedDemand = Math.ceil(sold30 * growth)
        const stock = stockByProductId[p.id] ?? 0
        const orderQty = Math.max(0, expectedDemand - stock)
        cogs += orderQty * (costByProductId[p.id] ?? 0)
      }
      seasonal_expected_cogs_eur += cogs
    }
  } catch {
    // seasonal_events optional
  }
  seasonal_expected_cogs_eur = Math.round(seasonal_expected_cogs_eur * 100) / 100

  return NextResponse.json({
    year,
    stock_value: Math.round(stock_value * 100) / 100,
    cashflow,
    revenue_ytd: Math.round((revenue_ytd - refunds_ytd) * 100) / 100,
    revenue_limit: settings.revenue_limit,
    refunds_ytd,
    seasonal_expected_cogs_eur,
    tax_summary: {
      total_income: Math.round(totalIncome * 100) / 100,
      total_expenses: Math.round(totalExpenses * 100) / 100,
      actual_profit: Math.round(actualProfit * 100) / 100,
      reserve_30_percent: tax_reserve,
      available_capital: Math.round(available_capital * 100) / 100,
    },
  })
}
