import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Micro-Frontend Component Registry */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ components: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('frontend_ux')
      .from('component_registry')
      .select('component_id, service_endpoint_url, fallback_behavior, timeout_ms, is_active')
      .order('component_id')

    if (error) return NextResponse.json({ components: [] }, { status: 200 })
    return NextResponse.json({ components: data ?? [] })
  } catch {
    return NextResponse.json({ components: [] }, { status: 200 })
  }
}
