import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export interface ProductOffer {
  product_id: string
  vendor_id: string | null
  offer_id: string | null
  seller_type: 'shop' | 'vendor'
  seller_name: string
  unit_price: number
  shipping_price_eur: number
  landed_price: number
  stock: number
  fulfillment_type: string
}

/** GET – Öffentlich: Alle Kaufoptionen für ein Produkt (Shop + Vendoren) + Buy-Box-Gewinner */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const { slug } = await Promise.resolve(context.params)
  if (!slug) return NextResponse.json({ error: 'Slug fehlt' }, { status: 400 })

  const supabase = await createServerSupabase()

  const { data: product, error: productErr } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (productErr || !product) {
    return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
  }

  const productId = product.id

  const { data: offers, error: offersErr } = await supabase
    .from('product_offers')
    .select('product_id, vendor_id, offer_id, seller_type, seller_name, unit_price, shipping_price_eur, landed_price, stock, fulfillment_type')
    .eq('product_id', productId)
    .order('landed_price', { ascending: true })

  if (offersErr) {
    console.error('product_offers query:', offersErr)
    return NextResponse.json({ offers: [], buybox_winner: null }, { status: 200 })
  }

  const typedOffers = (offers ?? []).map((o) => ({
    product_id: o.product_id,
    vendor_id: o.vendor_id ?? null,
    offer_id: o.offer_id ?? null,
    seller_type: o.seller_type as 'shop' | 'vendor',
    seller_name: String(o.seller_name ?? 'Unbekannt'),
    unit_price: Number(o.unit_price ?? 0),
    shipping_price_eur: Number(o.shipping_price_eur ?? 0),
    landed_price: Number(o.landed_price ?? 0),
    stock: Number(o.stock ?? 0),
    fulfillment_type: String(o.fulfillment_type ?? 'fbm'),
  })) as ProductOffer[]

  const buybox_winner = typedOffers[0] ?? null

  return NextResponse.json({
    offers: typedOffers,
    buybox_winner,
  })
}
