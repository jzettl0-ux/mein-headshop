import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – ASIN-Registry (Parent/Child) */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const parentOnly = searchParams.get('parent_only') === '1'

  const admin = createSupabaseAdmin()
  let q = admin
    .schema('catalog')
    .from('amazon_standard_identification_numbers')
    .select('*, products(id, name, slug)')
    .order('asin')

  if (parentOnly) {
    q = q.eq('is_parent', true) as typeof q
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – Neuen ASIN anlegen (Parent oder Child) */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const asinRaw = typeof body.asin === 'string' ? body.asin.trim().toUpperCase().slice(0, 15) : ''
  if (!/^[A-Z0-9]{8,15}$/.test(asinRaw)) {
    return NextResponse.json({ error: 'ASIN muss 8–15 alphanumerische Zeichen haben' }, { status: 400 })
  }

  const isParent = body.is_parent === true
  const productTypeId = typeof body.product_type_id === 'string' ? body.product_type_id.trim().toUpperCase() || 'ZUBEHOER' : 'ZUBEHOER'
  const parentAsin = !isParent && typeof body.parent_asin === 'string' ? body.parent_asin.trim().toUpperCase().slice(0, 15) || null : null
  const variationTheme = !isParent && typeof body.variation_theme === 'string' ? body.variation_theme.trim().slice(0, 50) || null : null
  const productId = !isParent && body.product_id ? body.product_id : null

  const admin = createSupabaseAdmin()
  const payload: Record<string, unknown> = {
    asin: asinRaw,
    product_type_id: productTypeId,
    is_parent: isParent,
  }
  if (!isParent) {
    payload.parent_asin = parentAsin
    payload.variation_theme = variationTheme
    payload.product_id = productId
  }

  const { data, error } = await admin
    .schema('catalog')
    .from('amazon_standard_identification_numbers')
    .insert(payload)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'ASIN existiert bereits' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
