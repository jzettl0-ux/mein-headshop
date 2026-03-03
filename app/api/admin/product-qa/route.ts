import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/** GET – Q&A nach Produkt oder alle */
export async function GET(request: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const productId = request.nextUrl.searchParams.get('product_id')
  const statusFilter = request.nextUrl.searchParams.get('status')

  const admin = createSupabaseAdmin()
  let q = admin
    .schema('advanced_ops')
    .from('product_qa')
    .select('*, products(id, name, slug)')
    .order('created_at', { ascending: false })

  if (productId) q = q.eq('product_id', productId)
  if (statusFilter && ['pending', 'answered', 'hidden'].includes(statusFilter)) {
    q = q.eq('status', statusFilter)
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
