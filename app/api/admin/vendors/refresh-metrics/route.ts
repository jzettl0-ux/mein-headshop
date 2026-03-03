import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * POST – Vendor-Metriken (ODR, LSR, VTR) neu berechnen und Buy-Box aktualisieren.
 * Benötigt Admin-Berechtigung.
 */
export async function POST() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()

  const { error } = await admin.rpc('refresh_vendor_performance_metrics')

  if (error) {
    console.error('admin/vendors/refresh-metrics:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: 'Vendor-Metriken und Buy-Box aktualisiert.',
  })
}
