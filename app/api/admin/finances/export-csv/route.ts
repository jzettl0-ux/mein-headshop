import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – CSV-Export für das Finanzamt: Einnahmen und Ausgaben des Jahres lückenlos.
 * Query: ?year=2025 (Standard: aktuelles Jahr)
 */
export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const yearParam = req.nextUrl.searchParams.get('year')
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
  if (Number.isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Ungültiges Jahr' }, { status: 400 })
  }

  const start = new Date(year, 0, 1, 0, 0, 0)
  const end = new Date(year, 11, 31, 23, 59, 59)

  const admin = createSupabaseAdmin()
  const { data: orders } = await admin
    .from('orders')
    .select('id, order_number, total, created_at, transaction_fee, tax_reserve, net_profit')
    .eq('payment_status', 'paid')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: true })

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

  const escapeCsv = (v: string | number): string => {
    const s = String(v)
    if (s.includes(';') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const rows: string[] = []
  const header = 'Datum;Typ;Beleg;Beschreibung;Betrag (€)'
  rows.push(header)

  for (const o of orders || []) {
    const date = new Date(o.created_at).toLocaleDateString('de-DE')
    const total = Number(o.total) ?? 0
    rows.push(`${date};Einnahme;#${o.order_number};Umsatz Bestellung;${total.toFixed(2)}`)
    const fee = Number(o.transaction_fee) ?? 0
    if (fee > 0) rows.push(`${date};Ausgabe;#${o.order_number};Zahlungsgebühr;-${fee.toFixed(2)}`)
  }

  let cogsByOrderId: Record<string, number> = {}
  for (const it of items) {
    const cost = costByProductId[it.product_id] ?? 0
    cogsByOrderId[it.order_id] = (cogsByOrderId[it.order_id] ?? 0) + cost * it.quantity
  }
  for (const o of orders || []) {
    const cogs = Math.round((cogsByOrderId[o.id] ?? 0) * 100) / 100
    if (cogs > 0) {
      const date = new Date(o.created_at).toLocaleDateString('de-DE')
      rows.push(`${date};Ausgabe;#${o.order_number};Wareneinsatz;-${cogs.toFixed(2)}`)
    }
  }

  try {
    const { data: refundRows } = await admin.from('refunds').select('order_id, amount_eur, created_at').gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
    const orderById = new Map((orders ?? []).map((o) => [o.id, o]))
    for (const r of refundRows ?? []) {
      const date = new Date((r as { created_at: string }).created_at).toLocaleDateString('de-DE')
      const amt = Number(r.amount_eur) ?? 0
      const order = orderById.get(r.order_id)
      const ref = order ? `#${order.order_number}` : ''
      rows.push(`${date};Ausgabe;${ref};Gutschrift/Erstattung;-${amt.toFixed(2)}`)
    }
  } catch {
    // refunds optional
  }

  const csv = '\uFEFF' + rows.join('\r\n')
  const filename = `Finanzamt-Export-${year}.csv`
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
