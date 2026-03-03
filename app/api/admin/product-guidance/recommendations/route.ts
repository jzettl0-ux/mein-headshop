/**
 * Vendor Product Recommendations – Empfehlungen an Vendoren
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const vendor_id = searchParams.get('vendor_id')
  const status = searchParams.get('status')

  const admin = createSupabaseAdmin()
  let q = admin
    .schema('analytics')
    .from('vendor_product_recommendations')
    .select('*, vendor_accounts(id, company_name), product_categories(id, slug, name)')
    .order('created_at', { ascending: false })

  if (vendor_id) q = q.eq('vendor_id', vendor_id)
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ recommendations: [] })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ recommendations: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { vendor_id, suggested_category_id, related_search_term, gap_id } = body
  if (!vendor_id) return NextResponse.json({ error: 'vendor_id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('analytics')
    .from('vendor_product_recommendations')
    .insert({
      vendor_id,
      suggested_category_id: suggested_category_id || null,
      related_search_term: related_search_term?.trim() || null,
      gap_id: gap_id || null,
      status: 'SUGGESTED',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
