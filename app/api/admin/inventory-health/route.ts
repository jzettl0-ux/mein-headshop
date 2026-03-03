/**
 * GET – Inventory Health Liste
 * POST – Berechnung auslösen
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { calculateInventoryHealth } from '@/lib/inventory-health'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('analytics')
    .from('inventory_health')
    .select(`
      *,
      vendor_offers(id, product_id, stock, unit_price, products(id, name, slug)),
      vendor_accounts(id, company_name)
    `)
    .order('needs_restock', { ascending: false })
    .order('days_of_supply', { ascending: true })

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ items: [] })
    console.error('[admin/inventory-health]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ items: data ?? [] })
}

export async function POST() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await calculateInventoryHealth()
    return NextResponse.json(result)
  } catch (e) {
    console.error('[admin/inventory-health]', e)
    return NextResponse.json(
      { error: (e as Error).message, processed: 0 },
      { status: 500 }
    )
  }
}
