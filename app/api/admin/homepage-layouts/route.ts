import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Bento Grid Homepage Layouts */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ layouts: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('ui_config')
      .from('homepage_layouts')
      .select('layout_id, layout_name, target_audience, bento_grid_jsonb, is_active, priority, updated_at')
      .order('priority', { ascending: true })
      .order('updated_at', { ascending: false })

    if (error) return NextResponse.json({ layouts: [] }, { status: 200 })
    return NextResponse.json({ layouts: data ?? [] })
  } catch {
    return NextResponse.json({ layouts: [] }, { status: 200 })
  }
}
