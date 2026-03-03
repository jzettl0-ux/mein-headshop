import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const VARIATION_COLS = 'id, name, slug, price, image_url, images, stock, variation_theme, asin'

/** GET – Öffentlich: Geschwister-Variationen (gleicher Parent-ASIN) */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const { slug } = await Promise.resolve(context.params)
  if (!slug) return NextResponse.json({ error: 'Slug fehlt' }, { status: 400 })

  const supabase = await createServerSupabase()

  const { data: product, error: productErr } = await supabase
    .from('products')
    .select('id, parent_asin, asin')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (productErr || !product) {
    return NextResponse.json({ variations: [] }, { status: 200 })
  }

  const parentAsin = product.parent_asin ?? product.asin
  if (!parentAsin) {
    return NextResponse.json({ variations: [] }, { status: 200 })
  }

  const { data: variations } = await supabase
    .from('products')
    .select(VARIATION_COLS)
    .eq('parent_asin', parentAsin)
    .eq('is_active', true)
    .neq('id', product.id)
    .order('price', { ascending: true })

  const list = (variations ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    image_url: p.image_url,
    images: Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []),
    stock: Number(p.stock ?? 0),
    variation_theme: p.variation_theme ?? null,
    asin: p.asin ?? null,
  }))

  return NextResponse.json({ variations: list })
}
