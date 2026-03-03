import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Liste aller Kundenanfragen (für Kundenservice).
 */
export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const orderId = searchParams.get('order_id') || ''

  const admin = createSupabaseAdmin()
  let query = admin
    .from('customer_inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && ['open', 'answered', 'closed'].includes(status)) {
    query = query.eq('status', status)
  }
  if (orderId) {
    query = query.eq('order_id', orderId)
  }

  const { data, error } = await query
  if (error) {
    console.error('[Admin inquiries]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
