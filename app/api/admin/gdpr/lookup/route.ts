import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminContext } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET – Kunde nach E-Mail suchen (für DSGVO-Löschung)
 * ?email=... – liefert user_id, order_count, inquiry_count
 */
export async function GET(req: NextRequest) {
  const { isOwner } = await getAdminContext()
  if (!isOwner) return NextResponse.json({ error: 'Nur Inhaber' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'email-Parameter erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()

  const { data: orderWithUser } = await admin
    .from('orders')
    .select('user_id')
    .ilike('customer_email', email)
    .not('user_id', 'is', null)
    .limit(1)
    .maybeSingle()
  const userId = orderWithUser?.user_id ?? null

  const { count: orderCount } = await admin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .ilike('customer_email', email)

  const { count: inquiryCount } = await admin
    .from('customer_inquiries')
    .select('*', { count: 'exact', head: true })
    .ilike('email', email)

  return NextResponse.json({
    email,
    userId,
    orderCount: orderCount ?? 0,
    inquiryCount: inquiryCount ?? 0,
    hasAccount: !!userId,
  })
}
