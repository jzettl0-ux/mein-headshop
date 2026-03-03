/**
 * GET /api/cart/sync
 * Liefert den server-seitigen Warenkorb des eingeloggten Users (cart_management)
 * für Hydration im Frontend nach Login.
 */
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ items: [] })
  if (!hasSupabaseAdmin()) return NextResponse.json({ items: [] })

  const admin = createSupabaseAdmin()

  const { data: cart } = await admin
    .schema('cart_management')
    .from('shopping_carts')
    .select('cart_id')
    .eq('customer_id', user.id)
    .eq('status', 'ACTIVE')
    .maybeSingle()

  if (!cart?.cart_id) return NextResponse.json({ items: [] })

  const { data: rows } = await admin
    .schema('cart_management')
    .from('cart_items')
    .select('product_id, quantity')
    .eq('cart_id', (cart as { cart_id: string }).cart_id)

  if (!rows?.length) return NextResponse.json({ items: [] })

  const productIds = [...new Set((rows as { product_id: string }[]).map((r) => r.product_id))]
  const { data: products } = await admin
    .from('products')
    .select('id, name, slug, description, price, image_url, images, category, stock, is_adult_only, exempt_from_adult_fee, is_featured, tags, created_at, updated_at')
    .in('id', productIds)

  const byId = new Map((products ?? []).map((p) => [p.id, p]))

  const items = (rows as { product_id: string; quantity: number }[])
    .map((r) => {
      const p = byId.get(r.product_id)
      if (!p) return null
      const product = p as Record<string, unknown>
      return {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description ?? '',
          price: Number(product.price),
          image_url: product.image_url ?? '',
          images: Array.isArray(product.images) ? product.images : [],
          category: product.category ?? 'zubehoer',
          stock: Number(product.stock) ?? 0,
          is_adult_only: Boolean(product.is_adult_only),
          exempt_from_adult_fee: product.exempt_from_adult_fee ?? undefined,
          is_featured: Boolean(product.is_featured),
          tags: Array.isArray(product.tags) ? product.tags : [],
          created_at: String(product.created_at ?? ''),
          updated_at: String(product.updated_at ?? ''),
        },
        quantity: r.quantity,
      }
    })
    .filter(Boolean)

  return NextResponse.json({ items })
}
