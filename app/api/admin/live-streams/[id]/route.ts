import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Einzelstream inkl. verknüpfter Produkte */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await params
  const admin = createSupabaseAdmin()
  const { data: stream, error: e1 } = await admin
    .schema('deep_tech')
    .from('live_streams')
    .select('*')
    .eq('stream_id', id)
    .single()

  if (e1 || !stream) return NextResponse.json({ error: 'Stream nicht gefunden' }, { status: 404 })

  const { data: mappings } = await admin
    .schema('deep_tech')
    .from('live_stream_products')
    .select('mapping_id, product_id, featured_timestamp_start, featured_timestamp_end')
    .eq('stream_id', id)

  const productIds = [...new Set((mappings ?? []).map((m: { product_id: string }) => m.product_id))]
  let products: { id: string; name: string; slug: string }[] = []
  if (productIds.length > 0) {
    const { data: prods } = await admin.from('products').select('id, name, slug').in('id', productIds)
    products = prods ?? []
  }
  const productMap = new Map(products.map((p) => [p.id, p]))
  const products_with_details = (mappings ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    product: productMap.get(m.product_id as string) ?? null,
  }))

  return NextResponse.json({ ...stream, products: products_with_details })
}

/** PATCH – Stream aktualisieren (Status, URL, Titel) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.stream_title === 'string' && body.stream_title.trim()) updates.stream_title = body.stream_title.trim()
  if (typeof body.hls_stream_url === 'string') updates.hls_stream_url = body.hls_stream_url.trim() || null
  if (['SCHEDULED', 'LIVE', 'ENDED', 'VOD'].includes(body.status)) updates.status = body.status
  if (typeof body.viewer_count === 'number') updates.viewer_count = body.viewer_count
  if (body.started_at !== undefined) updates.started_at = body.started_at || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('deep_tech')
    .from('live_streams')
    .update(updates)
    .eq('stream_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
