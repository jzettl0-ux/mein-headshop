import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Daten für "Bestellung ausführen": Lieferant, Firmenadresse, Produkte dieses Lieferanten (für Vorlage).
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const params = await Promise.resolve(context.params)
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: supplier, error: supErr } = await admin.from('suppliers').select('*').eq('id', id).single()
  if (supErr || !supplier) return NextResponse.json({ error: 'Lieferant nicht gefunden' }, { status: 404 })

  const { data: addrRow } = await admin.from('site_settings').select('value').eq('key', 'company_address').maybeSingle()
  const company_address = (addrRow?.value && String(addrRow.value).trim()) || ''

  const { data: products } = await admin
    .from('products')
    .select('id, name, stock')
    .eq('supplier_id', id)
    .order('name')

  return NextResponse.json({
    supplier: {
      name: supplier.name,
      contact_email: supplier.contact_email,
      order_email: supplier.order_email,
      contact_person: supplier.contact_person,
      contact_phone: supplier.contact_phone,
      website: supplier.website,
      notes: supplier.notes,
      minimum_order_value: supplier.minimum_order_value,
      payment_terms: supplier.payment_terms,
    },
    company_address,
    products: (products || []).map((p) => ({ id: p.id, name: p.name, stock: p.stock ?? 0 })),
  })
}
