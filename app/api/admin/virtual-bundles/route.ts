/**
 * Blueprint TEIL 20.2: Virtual Bundles (nur wenn catalog ASIN existiert)
 * GET: Liste mit Vendor | POST: Neues Bundle
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data: rows, error } = await admin
    .schema('catalog_automation')
    .from('virtual_bundles')
    .select('*')
    .order('bundle_title')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list = (rows ?? []) as Array<{ vendor_id: string }>
  const vIds = [...new Set(list.map((r) => r.vendor_id))]
  let vendors: Array<{ id: string; company_name: string | null }> = []
  if (vIds.length > 0) {
    const { data: v } = await admin.from('vendor_accounts').select('id, company_name').in('id', vIds)
    vendors = (v ?? []) as Array<{ id: string; company_name: string | null }>
  }
  const byId = Object.fromEntries(vendors.map((v) => [v.id, v.company_name]))
  return NextResponse.json((list ?? []).map((r) => ({ ...r, vendor_name: byId[r.vendor_id] ?? null })))
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const bundleAsin = String(body.bundle_asin ?? '').trim().slice(0, 15)
  const vendorId = body.vendor_id
  const title = String(body.bundle_title ?? '').trim()
  const price = Number(body.bundle_price)
  if (!bundleAsin || !vendorId || !title) return NextResponse.json({ error: 'bundle_asin, vendor_id, bundle_title erforderlich' }, { status: 400 })
  if (isNaN(price) || price < 0) return NextResponse.json({ error: 'bundle_price ungültig' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog_automation')
    .from('virtual_bundles')
    .insert({
      bundle_asin: bundleAsin,
      vendor_id: vendorId,
      bundle_title: title,
      bundle_price: Math.round(price * 100) / 100,
      is_active: body.is_active !== false,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
