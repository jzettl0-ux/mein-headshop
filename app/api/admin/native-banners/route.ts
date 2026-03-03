import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Native Bento-Grid Ads (Retail Media) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ banners: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('retail_media')
      .from('native_banners')
      .select('banner_id, vendor_id, campaign_id, target_layout_id, media_url, headline, cta_link, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ banners: [] }, { status: 200 })
    return NextResponse.json({ banners: data ?? [] })
  } catch {
    return NextResponse.json({ banners: [] }, { status: 200 })
  }
}
