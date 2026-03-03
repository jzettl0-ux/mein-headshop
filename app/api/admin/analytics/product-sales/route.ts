import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** Zeitraum: 7d | 30d | 90d | month | last_month | year | all */
function getDateRange(period: string): { from: string; to?: string } | null {
  const now = new Date()
  const to = now.toISOString()
  let from: Date

  switch (period) {
    case '7d':
      from = new Date(now)
      from.setDate(from.getDate() - 7)
      return { from: from.toISOString(), to }
    case '30d':
      from = new Date(now)
      from.setDate(from.getDate() - 30)
      return { from: from.toISOString(), to }
    case '90d':
      from = new Date(now)
      from.setDate(from.getDate() - 90)
      return { from: from.toISOString(), to }
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: from.toISOString(), to }
    case 'last_month': {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      return { from: from.toISOString(), to: lastMonthEnd.toISOString() }
    }
    case 'year':
      from = new Date(now.getFullYear(), 0, 1)
      return { from: from.toISOString(), to }
    case 'all':
    default:
      return null
  }
}

/**
 * GET – Verkaufte Mengen pro Produkt + Bestplatzierung (nur nicht stornierte Bestellungen).
 * Query: period = 7d | 30d | 90d | month | last_month | year | all (Standard: all)
 * Rückgabe: { items: [...], period, period_label }
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const period = request.nextUrl.searchParams.get('period') || 'all'
  const range = getDateRange(period)

  const admin = createSupabaseAdmin()

  let query = admin.from('orders').select('id').neq('status', 'cancelled')
  if (range) {
    query = query.gte('created_at', range.from)
    if (range.to) query = query.lte('created_at', range.to)
  }
  const { data: orders } = await query

  const orderIds = (orders ?? []).map((o) => o.id)
  if (orderIds.length === 0) {
    return NextResponse.json({ items: [] })
  }

  const { data: items } = await admin
    .from('order_items')
    .select('product_id, product_name, quantity, order_id')
    .in('order_id', orderIds)

  const byProduct = new Map<string, { product_name: string; totalQty: number; orderIds: Set<string> }>()

  for (const row of items ?? []) {
    const key = row.product_id || `name:${(row.product_name || '').trim()}` 
    const name = (row.product_name || 'Unbekannt').trim()
    if (!byProduct.has(key)) {
      byProduct.set(key, { product_name: name, totalQty: 0, orderIds: new Set() })
    }
    const rec = byProduct.get(key)!
    rec.totalQty += Number(row.quantity) || 0
    rec.orderIds.add(row.order_id)
  }

  const list = Array.from(byProduct.entries())
    .map(([product_id, v]) => ({
      product_id: product_id.startsWith('name:') ? null : product_id,
      product_name: v.product_name,
      total_quantity_sold: v.totalQty,
      order_count: v.orderIds.size,
    }))
    .sort((a, b) => b.total_quantity_sold - a.total_quantity_sold)

  const withRank = list.map((item, index) => ({ ...item, rank: index + 1 }))

  const periodLabels: Record<string, string> = {
    all: 'Gesamter Zeitraum',
    '7d': 'Letzte 7 Tage',
    '30d': 'Letzte 30 Tage',
    '90d': 'Letzte 90 Tage',
    month: 'Dieser Monat',
    last_month: 'Vorgänger-Monat',
    year: 'Dieses Jahr',
  }

  return NextResponse.json({
    items: withRank,
    period,
    period_label: periodLabels[period] || periodLabels.all,
  })
}
