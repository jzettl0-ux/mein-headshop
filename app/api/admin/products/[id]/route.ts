import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { canAccessProducts, canSeePurchasePrices } from '@/lib/admin-permissions'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { logEntityChanges } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

/**
 * PATCH – Produkt aktualisieren (Preis, Bestand, Einkaufspreis etc.). Änderungen werden in audit_logs protokolliert.
 * cost_price darf nur von Rollen mit canSeePurchasePrices (Owner, Chef, Admin) gesetzt werden.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin, staff, roles } = await getAdminContext()
  const effectiveRoles = roles?.length ? roles : []
  if (!isAdmin || !canAccessProducts(effectiveRoles)) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const maySetCostPrice = canSeePurchasePrices(effectiveRoles)

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'Produkt-ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const admin = createSupabaseAdmin()

  const { data: current, error: fetchErr } = await admin.from('products').select('price, cost_price, stock, min_stock_level').eq('id', id).single()
  if (fetchErr || !current) return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })

  const allowed = [
    'name', 'slug', 'description', 'price', 'cost_price', 'image_url', 'images', 'category', 'subcategory_slug', 'brand', 'asin', 'parent_asin', 'variation_theme',
    'stock', 'min_stock_level', 'is_adult_only', 'exempt_from_adult_fee', 'is_featured', 'is_active', 'influencer_id', 'supplier_id',
    'supplier_sku', 'supplier_product_name', 'tags', 'discount_percent', 'discount_until', 'reference_price_30d',
    'is_new_override', 'on_sale', 'discount_text',
  ]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] === undefined) continue
    if (key === 'cost_price' && !maySetCostPrice) continue
    if (key === 'price' || key === 'cost_price' || key === 'reference_price_30d') updates[key] = body[key] != null && body[key] !== '' ? Number(body[key]) : null
    else if (key === 'stock' || key === 'min_stock_level' || key === 'discount_percent') updates[key] = body[key] != null ? Number(body[key]) : 0
    else if (key === 'tags') updates[key] = Array.isArray(body[key]) ? body[key] : (body[key] && typeof body[key] === 'string' ? body[key].split(',').map((s: string) => s.trim()).filter(Boolean) : [])
    else if (key === 'discount_until') updates[key] = body[key] && String(body[key]).trim() ? body[key] : null
    else if (key === 'supplier_sku' || key === 'supplier_product_name' || key === 'asin' || key === 'parent_asin') updates[key] = body[key] != null && String(body[key]).trim() ? String(body[key]).trim().toUpperCase() : null
    else if (key === 'is_new_override' || key === 'on_sale' || key === 'exempt_from_adult_fee') updates[key] = Boolean(body[key])
    else if (key === 'discount_text' || key === 'variation_theme') updates[key] = body[key] != null && String(body[key]).trim() ? String(body[key]).trim() : null
    else updates[key] = body[key]
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine gültigen Felder' }, { status: 400 })

  const { data: updated, error: updateErr } = await admin
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  const oldRecord = {
    price: current.price,
    cost_price: current.cost_price,
    stock: current.stock,
    min_stock_level: (current as { min_stock_level?: number }).min_stock_level,
  } as Record<string, unknown>
  const newRecord = { ...oldRecord, ...updates }
  await logEntityChanges(admin, 'product', id, oldRecord, newRecord, { email: staff?.email, id: staff?.id })

  return NextResponse.json(updated)
}
