import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export interface InfluencerRow {
  id: string
  name: string
  slug: string
  user_id: string | null
  commission_rate: number
  can_request_code_change: boolean
  is_active: boolean
}

/**
 * Prüft ob die aktuelle Session einem Influencer zugeordnet ist (influencers.user_id = auth.uid).
 * Für API Routes: User aus Cookie-Session, Influencer aus DB.
 */
export async function getInfluencerContext(): Promise<{
  user: { id: string; email: string } | null
  influencer: InfluencerRow | null
  isInfluencer: boolean
}> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) {
    return { user: null, influencer: null, isInfluencer: false }
  }

  if (!hasSupabaseAdmin()) {
    return { user: { id: user.id, email: user.email ?? '' }, influencer: null, isInfluencer: false }
  }

  const admin = createSupabaseAdmin()
  const { data: row } = await admin
    .from('influencers')
    .select('id, name, slug, user_id, commission_rate, can_request_code_change, is_active')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!row) {
    return { user: { id: user.id, email: user.email ?? '' }, influencer: null, isInfluencer: false }
  }

  const influencer: InfluencerRow = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    user_id: row.user_id,
    commission_rate: Number(row.commission_rate) ?? 10,
    can_request_code_change: Boolean(row.can_request_code_change),
    is_active: Boolean(row.is_active),
  }

  return { user: { id: user.id, email: user.email ?? '' }, influencer, isInfluencer: true }
}
