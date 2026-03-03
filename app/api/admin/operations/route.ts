import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Liste Einkäufe, aggregiert nach Monat (Wareneinkauf vs Betriebsmittel)
 */
export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const url = new URL(req.url)
  const month = url.searchParams.get('month')
  const supplierId = url.searchParams.get('supplier_id')
  const archive = url.searchParams.get('archive') === '1'

  const admin = createSupabaseAdmin()

  let query = admin
    .from('purchases')
    .select('id, supplier_id, invoice_number, invoice_date, type, total_eur, invoice_pdf_url, notes, created_at, suppliers(id, name)')
    .order('invoice_date', { ascending: false })

  if (month?.match(/^\d{4}-\d{2}$/)) {
    const [y, m] = month.split('-').map(Number)
    const start = new Date(y, m - 1, 1).toISOString()
    const end = new Date(y, m, 0, 23, 59, 59).toISOString()
    query = query.gte('invoice_date', start.slice(0, 10)).lte('invoice_date', end.slice(0, 10))
  }
  if (supplierId) {
    query = query.eq('supplier_id', supplierId)
  }

  const { data: purchases, error } = await query

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json({ purchases: [], summary: { cogs: 0, opex: 0 } })
    }
    console.error('Operations list error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const list = (purchases ?? []).map((p: Record<string, unknown>) => {
    const s = p.suppliers as { name?: string } | { name?: string }[] | null | undefined
    const name = Array.isArray(s) ? (s[0] as { name?: string })?.name : (s as { name?: string } | null)?.name
    return { ...p, supplier_name: name ?? null }
  })

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const targetMonth = month ?? currentMonth

  const monthList = list.filter((p) => {
    const d = String((p as Record<string, unknown>).invoice_date).slice(0, 7)
    return d === targetMonth
  })

  const summary = {
    cogs: monthList
      .filter((p: Record<string, unknown>) => p.type === 'wareneinkauf')
      .reduce((s: number, p: Record<string, unknown>) => s + Number(p.total_eur ?? 0), 0),
    opex: monthList
      .filter((p: Record<string, unknown>) => p.type === 'betriebsmittel')
      .reduce((s: number, p: Record<string, unknown>) => s + Number(p.total_eur ?? 0), 0),
  }

  return NextResponse.json({
    purchases: archive ? list : list.slice(0, 20),
    summary,
    current_month: targetMonth,
  })
}

/**
 * POST – Neuer Einkauf mit Positionen, optional Lagererhöhung
 */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  let body: {
    supplier_id?: string | null
    invoice_number?: string | null
    invoice_date?: string
    type?: 'wareneinkauf' | 'betriebsmittel'
    invoice_pdf_url?: string | null
    notes?: string | null
    add_to_stock_immediately?: boolean
    items: {
      product_id?: string | null
      description: string
      quantity?: number
      unit_price_eur: number
      bundle_size?: number | null
      bundle_count?: number | null
    }[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 })
  }

  const items = Array.isArray(body.items) ? body.items : []
  if (items.length === 0) {
    return NextResponse.json({ error: 'Mindestens eine Position erforderlich' }, { status: 400 })
  }

  const resolvedItems: { product_id: string | null; description: string; quantity: number; unit_price_eur: number; is_bundle: boolean; bundle_size: number | null; bundle_count: number | null }[] = []
  for (const i of items) {
    const bundleSize = i.bundle_size != null ? Number(i.bundle_size) : null
    const bundleCount = i.bundle_count != null ? Number(i.bundle_count) : null
    const isBundle = bundleSize != null && bundleCount != null && bundleSize > 0 && bundleCount > 0
    const quantity = isBundle
      ? Math.round(bundleSize * bundleCount * 1000) / 1000
      : (Number(i.quantity) || 0)
    resolvedItems.push({
      product_id: i.product_id || null,
      description: String(i.description || '').trim() || 'Position',
      quantity,
      unit_price_eur: Number(i.unit_price_eur) || 0,
      is_bundle: isBundle,
      bundle_size: isBundle ? bundleSize : null,
      bundle_count: isBundle ? bundleCount : null,
    })
  }

  const totalEur = resolvedItems.reduce((s, i) => s + i.quantity * i.unit_price_eur, 0)
  const invoiceDate = body.invoice_date?.match(/^\d{4}-\d{2}-\d{2}$/) ? body.invoice_date : new Date().toISOString().slice(0, 10)
  const addToStock = body.add_to_stock_immediately !== false

  const admin = createSupabaseAdmin()

  const { data: purchase, error: insertErr } = await admin
    .from('purchases')
    .insert({
      supplier_id: body.supplier_id || null,
      invoice_number: body.invoice_number?.trim() || null,
      invoice_date: invoiceDate,
      type: body.type === 'betriebsmittel' ? 'betriebsmittel' : 'wareneinkauf',
      total_eur: Math.round(totalEur * 100) / 100,
      invoice_pdf_url: body.invoice_pdf_url?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .select('id')
    .single()

  if (insertErr) {
    if (insertErr.code === '42P01') {
      return NextResponse.json(
        { error: 'Tabelle purchases fehlt. Bitte supabase/migration-purchases-procurement.sql ausführen.' },
        { status: 503 }
      )
    }
    console.error('Purchase insert error', insertErr)
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  const purchaseId = purchase.id

  for (let idx = 0; idx < resolvedItems.length; idx++) {
    const it = resolvedItems[idx]
    const qty = it.quantity
    const up = it.unit_price_eur
    const tot = Math.round(qty * up * 100) / 100
    const insertRow: Record<string, unknown> = {
      purchase_id: purchaseId,
      product_id: it.product_id || null,
      description: it.description,
      quantity: qty,
      quantity_received: addToStock && it.product_id && qty > 0 ? qty : 0,
      unit_price_eur: up,
      total_eur: tot,
      sort_order: idx,
    }
    if (it.is_bundle && it.bundle_size != null && it.bundle_count != null) {
      insertRow.is_bundle = true
      insertRow.bundle_size = it.bundle_size
      insertRow.bundle_count = it.bundle_count
    }
    await admin.from('purchase_items').insert(insertRow)

    if (addToStock && it.product_id && qty > 0) {
      const { data: prod } = await admin.from('products').select('stock').eq('id', it.product_id).single()
      const curStock = Math.max(0, Number(prod?.stock ?? 0))
      const updates: { stock: number; cost_price?: number; default_bundle_size?: number } = { stock: curStock + qty }
      if (Number.isFinite(up) && up >= 0) {
        updates.cost_price = up
      }
      if (it.is_bundle && it.bundle_size != null && it.bundle_size > 0) {
        updates.default_bundle_size = it.bundle_size
      }
      await admin.from('products').update(updates).eq('id', it.product_id)
    }
  }

  return NextResponse.json({ id: purchaseId })
}
