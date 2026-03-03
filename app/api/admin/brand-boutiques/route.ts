import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Brand Boutiques (Shop-in-Shop) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ stores: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('brand_stores')
      .from('custom_storefronts')
      .select('store_id, brand_registry_id, store_slug, hero_video_url, primary_color_hex, secondary_color_hex, status, published_at, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ stores: [] }, { status: 200 })
    return NextResponse.json({ stores: data ?? [] })
  } catch {
    return NextResponse.json({ stores: [] }, { status: 200 })
  }
}
