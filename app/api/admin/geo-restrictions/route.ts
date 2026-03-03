import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Geo-Compliance-Blocker */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ restrictions: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('legal_compliance')
      .from('geo_restrictions')
      .select('restriction_id, entity_type, entity_id, blocked_country_code, blocked_zip_codes, reason_code, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ restrictions: [] }, { status: 200 })
    return NextResponse.json({ restrictions: data ?? [] })
  } catch {
    return NextResponse.json({ restrictions: [] }, { status: 200 })
  }
}
