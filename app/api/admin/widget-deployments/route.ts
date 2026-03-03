import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Off-Platform Widget Deployments (Buy With) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ deployments: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('external_commerce')
      .from('widget_deployments')
      .select('widget_id, vendor_id, domain_whitelist, public_api_key, status, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ deployments: [] }, { status: 200 })
    return NextResponse.json({ deployments: data ?? [] })
  } catch {
    return NextResponse.json({ deployments: [] }, { status: 200 })
  }
}
