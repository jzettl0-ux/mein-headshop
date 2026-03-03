import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/subscriptions
 * Liste aller Subscribe & Save Abos (cx.subscriptions).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')

  const admin = createSupabaseAdmin()
  let q = admin
    .schema('cx')
    .from('subscriptions')
    .select('subscription_id, customer_id, product_id, quantity, interval_days, discount_percentage, next_order_date, status, created_at')
    .order('next_order_date', { ascending: true })
  if (statusFilter && statusFilter !== '_all') q = q.eq('status', statusFilter)
  const { data: rows, error } = await q

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json([])

  const productIds = [...new Set(rows.map((r: { product_id: string }) => r.product_id))]
  const { data: products } = await admin.from('products').select('id, name, slug, image_url').in('id', productIds)
  const productMap = new Map((products ?? []).map((p: { id: string }) => [p.id, p]))

  const result = rows.map((r: Record<string, unknown>) => ({
    ...r,
    product: productMap.get(r.product_id as string) ?? null,
  }))
  return NextResponse.json(result)
}
