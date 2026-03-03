import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – A+ Content (optional gefiltert nach product_id) */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const productId = request.nextUrl.searchParams.get('product_id')
  const admin = createSupabaseAdmin()

  let q = admin
    .schema('catalog')
    .from('aplus_content')
    .select('*, products(id, name, slug)')
    .order('product_id')
    .order('sort_order', { ascending: true })

  if (productId) q = q.eq('product_id', productId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – A+ Block anlegen */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const productId = body.product_id
  const blockType = ['image_text', 'text_only', 'comparison_table', 'feature_list', 'image_gallery'].includes(body.block_type)
    ? body.block_type
    : 'text_only'
  const content = body.content && typeof body.content === 'object' ? body.content : {}
  const sortOrder = Math.max(0, Math.floor(Number(body.sort_order) ?? 0))

  if (!productId) {
    return NextResponse.json({ error: 'product_id erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog')
    .from('aplus_content')
    .insert({
      product_id: productId,
      block_type: blockType,
      content,
      sort_order: sortOrder,
      is_active: body.is_active !== false,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
