import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const MAX_ENTRIES = 100

/**
 * POST – Wareneingang: Bestand zu Artikeln hinzufügen (nicht ersetzen).
 * Body: { entries: [{ product_id: string, quantity: number }] }
 * Berechnet automatisch: neuer Bestand = aktueller Bestand + Menge.
 */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const raw = body.entries
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: 'entries (Array mit product_id + quantity) erforderlich' }, { status: 400 })
  }
  if (raw.length > MAX_ENTRIES) {
    return NextResponse.json({ error: `Maximal ${MAX_ENTRIES} Zeilen pro Aufruf` }, { status: 400 })
  }

  const entries: { product_id: string; quantity: number }[] = []
  for (const row of raw) {
    const product_id = typeof row.product_id === 'string' ? row.product_id.trim() : ''
    const quantity = Math.max(0, Math.floor(Number(row.quantity) || 0))
    if (!product_id || quantity === 0) continue
    entries.push({ product_id, quantity })
  }

  if (entries.length === 0) {
    return NextResponse.json({ error: 'Keine gültigen Einträge (product_id + quantity > 0)' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const productIds = [...new Set(entries.map((e) => e.product_id))]
  const { data: products, error: fetchErr } = await admin
    .from('products')
    .select('id, stock')
    .in('id', productIds)
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const stockById: Record<string, number> = {}
  for (const p of products || []) {
    stockById[p.id] = Math.max(0, Number(p.stock) ?? 0)
  }

  for (const e of entries) {
    const current = stockById[e.product_id] ?? 0
    const newStock = current + e.quantity
    stockById[e.product_id] = newStock
    const { error: upErr } = await admin
      .from('products')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', e.product_id)
    if (upErr) return NextResponse.json({ error: `Produkt ${e.product_id}: ${upErr.message}` }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    updated: entries.length,
    message: `Bestand für ${entries.length} Artikel erhöht.`,
  })
}
