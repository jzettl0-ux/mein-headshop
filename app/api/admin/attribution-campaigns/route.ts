import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Attribution Campaigns (Brand Referral Bonus) laden */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ campaigns: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: campaigns, error } = await admin
      .schema('marketing')
      .from('attribution_campaigns')
      .select('campaign_id, vendor_id, campaign_name, tracking_code, commission_discount_percentage, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ campaigns: [] }, { status: 200 })

    return NextResponse.json({ campaigns: campaigns ?? [] })
  } catch {
    return NextResponse.json({ campaigns: [] }, { status: 200 })
  }
}
