import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Warehouse Wave Picking */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ waves: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('warehouse_ops')
      .from('picking_waves')
      .select('wave_id, warehouse_zone, assigned_picker_id, total_items_to_pick, status, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ waves: [] }, { status: 200 })
    return NextResponse.json({ waves: data ?? [] })
  } catch {
    return NextResponse.json({ waves: [] }, { status: 200 })
  }
}
