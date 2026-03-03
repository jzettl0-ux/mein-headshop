import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** POST – Produkt einem Stream zuordnen */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id: stream_id } = await params
  const body = await request.json().catch(() => ({}))
  const product_id = body.product_id
  if (!product_id) return NextResponse.json({ error: 'product_id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('deep_tech')
    .from('live_stream_products')
    .insert({
      stream_id,
      product_id,
      featured_timestamp_start: typeof body.featured_timestamp_start === 'number' ? body.featured_timestamp_start : null,
      featured_timestamp_end: typeof body.featured_timestamp_end === 'number' ? body.featured_timestamp_end : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** DELETE – Produkt aus Stream entfernen (query: product_id=) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id: stream_id } = await params
  const product_id = request.nextUrl.searchParams.get('product_id')
  if (!product_id) return NextResponse.json({ error: 'product_id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .schema('deep_tech')
    .from('live_stream_products')
    .delete()
    .eq('stream_id', stream_id)
    .eq('product_id', product_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
