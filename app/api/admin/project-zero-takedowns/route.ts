import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Liste Project Zero Takedowns (Blueprint Phase 10: Power User).
 * brand_tools.project_zero_takedowns – nur wenn Migration (security.transparency_brands, vendor_offers) ausgeführt.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ takedowns: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: rows, error } = await admin
      .schema('brand_tools')
      .from('project_zero_takedowns')
      .select('takedown_id, brand_registry_id, target_offer_id, reason_code, action_taken_at, is_appealed, appeal_successful, admin_reviewed_at')
      .order('action_taken_at', { ascending: false })

    if (error) {
      console.error('[project-zero-takedowns] list error:', error.message)
      return NextResponse.json({ takedowns: [] })
    }

    return NextResponse.json({ takedowns: rows ?? [] })
  } catch (e) {
    console.error('[project-zero-takedowns] error:', e)
    return NextResponse.json({ takedowns: [] })
  }
}
