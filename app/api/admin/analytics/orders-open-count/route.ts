import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Anzahl Bestellungen, die noch bearbeitet werden müssen (bezahlt, noch nicht versandt).
 * Gleiche Logik wie „Zum Bearbeiten bereit“ auf /admin/orders.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { count, error } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('payment_status', 'paid')
    .in('status', ['pending', 'processing'])

  if (error) return NextResponse.json({ error: error.message, count: 0 }, { status: 500 })
  return NextResponse.json({ count: count ?? 0 })
}
