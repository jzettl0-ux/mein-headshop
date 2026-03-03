import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/vendor-flex/nodes
 * Öffentliche API für Partner (Vendor-Flex-Nodes).
 * Header: x-vendor-flex-api-key = VENDOR_FLEX_API_KEY (aus .env)
 * Optional: ?vendor_id= um nur Nodes eines Vendors zu erhalten.
 */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-vendor-flex-api-key') ?? request.nextUrl.searchParams.get('api_key') ?? ''
  const expected = process.env.VENDOR_FLEX_API_KEY?.trim()
  if (!expected || apiKey !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const vendorId = request.nextUrl.searchParams.get('vendor_id')
  const admin = createSupabaseAdmin()
  let q = admin
    .schema('margins')
    .from('vendor_flex_nodes')
    .select('node_id, vendor_id, physical_address, daily_processing_capacity, is_active, api_endpoint_url, registered_at')
    .eq('is_active', true)
    .order('registered_at', { ascending: false })
  if (vendorId) q = q.eq('vendor_id', vendorId)
  const { data, error } = await q

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ nodes: data ?? [] })
}
