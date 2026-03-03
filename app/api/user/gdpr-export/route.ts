import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/gdpr-export
 * Sammelt alle Daten des eingeloggten Nutzers (Art. 15 DSGVO) und gibt sie als JSON zurück.
 * Jeder Aufruf wird in security_audit_logs als GDPR_DATA_EXPORT geloggt.
 */
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const uid = user.id
  const email = user.email ?? ''

  // a) Profil: Auth + Adressen
  const { data: addresses } = await admin
    .from('customer_addresses')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })

  // b) Treue
  const { data: loyaltyAccount } = await admin
    .from('loyalty_accounts')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle()
  const { data: loyaltyTransactions } = await admin
    .from('loyalty_transactions')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })

  // c) Bestellungen inkl. Positionen
  const { data: orders } = await admin
    .from('orders')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })

  const orderIds = (orders ?? []).map((o: { id: string }) => o.id)
  let orderItems: unknown[] = []
  if (orderIds.length > 0) {
    const { data: items } = await admin
      .from('order_items')
      .select('*')
      .in('order_id', orderIds)
    orderItems = items ?? []
  }

  // d) Bewertungen: product_ratings (user_id) + product_reviews (über order_items des Nutzers)
  const { data: productRatings } = await admin
    .from('product_ratings')
    .select('*')
    .eq('user_id', uid)

  const orderItemIds = (orderItems as { id: string }[]).map((i) => i.id)
  let productReviews: unknown[] = []
  if (orderItemIds.length > 0) {
    const { data: reviews } = await admin
      .from('product_reviews')
      .select('*')
      .in('order_item_id', orderItemIds)
    productReviews = reviews ?? []
  }

  const payload = {
    export_date: new Date().toISOString(),
    subject: 'Datenauskunft gemäß Art. 15 DSGVO',
    profile: {
      auth_id: uid,
      email,
      email_confirmed_at: (user as { email_confirmed_at?: string }).email_confirmed_at ?? null,
      created_at: (user as { created_at?: string }).created_at ?? null,
      addresses: addresses ?? [],
    },
    loyalty: {
      account: loyaltyAccount ?? null,
      transactions: loyaltyTransactions ?? [],
    },
    orders: (orders ?? []).map((o: Record<string, unknown>) => {
      const oid = o.id as string
      const items = (orderItems as { order_id: string }[]).filter((i) => i.order_id === oid)
      return { ...o, items }
    }),
    ratings: productRatings ?? [],
    reviews: productReviews ?? [],
  }

  // Logging: security_audit_logs
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null
  await admin.from('security_audit_logs').insert({
    event: 'GDPR_DATA_EXPORT',
    user_id: uid,
    user_email: email,
    metadata: { order_count: (orders ?? []).length, has_addresses: (addresses ?? []).length > 0 },
    ip_address: ip,
  })

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="meine-daten-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
