import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Anzahl offener Storno- und Rücksendeanfragen (nur pending).
 * Gleiche Logik wie /admin/requests, damit das Dashboard die gleiche Zahl anzeigt.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data: orders } = await admin
    .from('orders')
    .select('id, status, cancellation_requested_at, cancellation_request_status, return_requested_at, return_request_status')

  const isPending = (s: string | null | undefined) => !s || s === 'pending'
  const stornoOffen = (orders ?? []).filter((o) => o.cancellation_requested_at && o.status !== 'cancelled' && isPending(o.cancellation_request_status)).length
  const retourOffen = (orders ?? []).filter((o) => o.return_requested_at && isPending(o.return_request_status)).length
  const count = stornoOffen + retourOffen

  return NextResponse.json({ count })
}
