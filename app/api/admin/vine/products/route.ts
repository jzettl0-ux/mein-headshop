import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/vine/products
 * Liste aller Produkte im Vine-Programm.
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  try {
    const { data: rows, error } = await admin
      .schema('cx')
      .from('vine_products')
      .select('product_id, max_testers, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[vine/products]', error.message)
      return NextResponse.json([])
    }
    if (!rows?.length) return NextResponse.json([])

    const productIds = rows.map((r: { product_id: string }) => r.product_id)
    const { data: prods } = await admin.from('products').select('id, name, slug, image_url').in('id', productIds)
    const prodMap = new Map((prods ?? []).map((p: { id: string }) => [p.id, p]))

    const result = rows.map((r: Record<string, unknown>) => ({
      ...r,
      products: prodMap.get(r.product_id as string) ?? null,
    }))
    return NextResponse.json(result)
  } catch (e) {
    console.error('[vine/products]', e)
    return NextResponse.json([])
  }
}

/**
 * POST /api/admin/vine/products
 * Produkt ins Vine-Programm aufnehmen.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const { product_id, max_testers = 5 } = body
  if (!product_id) {
    return NextResponse.json({ error: 'product_id fehlt' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('cx')
    .from('vine_products')
    .upsert(
      { product_id, max_testers: Math.max(1, Number(max_testers) ?? 5), status: 'ACTIVE' },
      { onConflict: 'product_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
