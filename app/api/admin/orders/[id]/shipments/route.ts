import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Alle Sendungen einer Bestellung (Service-Role, unabhängig von RLS).
 * Wird genutzt, damit alle Admins die Sendungsnummern sehen, nicht nur bei bestimmter RLS-Policy.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolved = typeof (context.params as Promise<unknown>)?.then === 'function'
    ? await (context.params as Promise<{ id?: string }>)
    : (context.params as { id?: string })
  const orderId = typeof resolved?.id === 'string' ? resolved.id.trim() : ''
  if (!orderId) return NextResponse.json({ error: 'orderId fehlt' }, { status: 400 })

  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data: shipments, error } = await admin
    .from('order_shipments')
    .select('id, order_id, tracking_number, tracking_carrier, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[shipments] GET error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const res = NextResponse.json({ shipments: shipments ?? [] })
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return res
}
