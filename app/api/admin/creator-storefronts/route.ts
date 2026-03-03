import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Creator Profiles & Ideenlisten */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ profiles: [], lists: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: profiles, error: pe } = await admin
      .schema('creator_economy')
      .from('influencer_profiles')
      .select('creator_id, influencer_id, vanity_url_slug, social_handle, custom_commission_rate, status, created_at')
      .order('created_at', { ascending: false })

    if (pe) return NextResponse.json({ profiles: [], lists: [] }, { status: 200 })

    const infIds = [...new Set((profiles ?? []).map((p) => (p as { influencer_id: string }).influencer_id).filter(Boolean))]
    let infMap = new Map<string, string>()
    if (infIds.length > 0) {
      const { data: inf } = await admin.from('influencers').select('id, name').in('id', infIds)
      infMap = new Map((inf ?? []).map((i) => [i.id, (i as { name?: string }).name ?? i.id]))
    }

    const enrichedProfiles = (profiles ?? []).map((p) => ({
      ...p,
      influencer_name: p.influencer_id ? infMap.get(p.influencer_id) ?? '–' : '–',
    }))

    const { data: lists } = await admin
      .schema('creator_economy')
      .from('storefront_idea_lists')
      .select('list_id, creator_id, list_title, product_ids, asins_included, is_published, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    return NextResponse.json({ profiles: enrichedProfiles, lists: lists ?? [] })
  } catch {
    return NextResponse.json({ profiles: [], lists: [] }, { status: 200 })
  }
}
