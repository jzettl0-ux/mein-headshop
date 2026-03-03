import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getFulfillmentRoutes } from '@/lib/fulfillment-routing'

export const dynamic = 'force-dynamic'

/** GET – Admin: Fulfillment-Routing (FBA vs. FBM) für Bestellung */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const resolved = await Promise.resolve(context.params)
  const orderId = typeof resolved?.id === 'string' ? resolved.id.trim() : ''
  if (!orderId) {
    return NextResponse.json({ error: 'Bestell-ID fehlt' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const result = await getFulfillmentRoutes(admin, orderId)
  return NextResponse.json(result)
}
