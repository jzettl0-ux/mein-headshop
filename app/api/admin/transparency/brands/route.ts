/**
 * Transparency Brands – Marken/Produkte im Anti-Fälschungs-Programm
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('security')
    .from('transparency_brands')
    .select('*, products(id, name, slug), vendor_accounts(id, company_name)')
    .order('enrolled_at', { ascending: false })

  if (error) {
    console.error('[admin/transparency/brands]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ brands: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { vendor_id, product_id, asin } = body
  if (!vendor_id) return NextResponse.json({ error: 'vendor_id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('security')
    .from('transparency_brands')
    .insert({
      vendor_id,
      product_id: product_id || null,
      asin: asin?.trim() || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
