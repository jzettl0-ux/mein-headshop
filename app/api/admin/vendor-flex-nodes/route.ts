import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Vendor Flex Nodes */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ nodes: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('margins')
      .from('vendor_flex_nodes')
      .select('node_id, vendor_id, daily_processing_capacity, is_active, api_endpoint_url, registered_at')
      .order('registered_at', { ascending: false })

    if (error) return NextResponse.json({ nodes: [] }, { status: 200 })
    return NextResponse.json({ nodes: data ?? [] })
  } catch {
    return NextResponse.json({ nodes: [] }, { status: 200 })
  }
}
