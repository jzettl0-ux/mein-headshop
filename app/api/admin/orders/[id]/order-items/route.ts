import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Bestellpositionen einer Bestellung (Admin, Service-Role).
 * Liefert dieselben IDs wie die DB, damit Paketinhalt-Speichern zuverlässig funktioniert.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolved = await Promise.resolve(context.params)
  const orderId = typeof resolved?.id === 'string' ? resolved.id.trim() : ''
  if (!orderId) return NextResponse.json({ error: 'orderId fehlt' }, { status: 400 })

  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('id', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
