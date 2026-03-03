import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getBuyboxWinners } from '@/lib/get-buybox-winners'

export const dynamic = 'force-dynamic'

/**
 * POST – Gibt die voraussichtlichen Packages (Vendor-Gruppierung) für den Warenkorb zurück.
 * Phase 3.2: Warenkorb → mehrere Packages.
 * Body: { items: [{ product_id, quantity }] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const items = body?.items as Array<{ product_id: string; quantity: number }> | undefined
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ packages: [] })
    }

    const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))]
    if (productIds.length === 0) return NextResponse.json({ packages: [] })

    const supabase = await createServerSupabase()
    const admin = hasSupabaseAdmin() ? createSupabaseAdmin() : supabase

    const buyboxMap = await getBuyboxWinners(admin, productIds)
    const vendorIds = [...new Set(
      Array.from(buyboxMap.values())
        .filter((w): w is NonNullable<typeof w> => w != null && w.seller_type === 'vendor' && w.vendor_id != null)
        .map((w) => w.vendor_id as string)
    )]
    const { data: vendors } = vendorIds.length
      ? await admin.from('vendor_accounts').select('id, company_name').in('id', vendorIds)
      : { data: [] }
    const vendorNameMap = new Map((vendors ?? []).map((v) => [v.id, (v as { company_name?: string }).company_name ?? 'Vendor']))

    const quantityByProduct = new Map(items.map((i) => [i.product_id, i.quantity]))

    const packageMap = new Map<string, { seller_name: string; seller_type: string; items: { name: string; quantity: number; price: number }[]; subtotal: number }>()

    const { data: products } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds)

    const productMap = new Map((products ?? []).map((p) => [p.id, p]))

    for (const item of items) {
      const product = productMap.get(item.product_id)
      if (!product) continue
      const winner = buyboxMap.get(item.product_id)
      const sellerType = winner?.seller_type ?? 'shop'
      const sellerName = sellerType === 'vendor' && winner?.vendor_id
        ? (vendorNameMap.get(winner.vendor_id) ?? 'Vendor')
        : 'Unser Shop'
      const price = winner ? winner.unit_price : Number(product.price)
      const qty = Math.max(1, Math.floor(quantityByProduct.get(item.product_id) ?? 1))
      const key = `${winner?.vendor_id ?? 'shop'}|${sellerType}`

      const existing = packageMap.get(key)
      if (existing) {
        existing.items.push({ name: product.name, quantity: qty, price })
        existing.subtotal += price * qty
      } else {
        packageMap.set(key, {
          seller_name: sellerName,
          seller_type: sellerType,
          items: [{ name: product.name, quantity: qty, price }],
          subtotal: price * qty,
        })
      }
    }

    const packages = Array.from(packageMap.values()).map((p) => ({
      ...p,
      subtotal: Math.round(p.subtotal * 100) / 100,
    }))

    return NextResponse.json({ packages })
  } catch (e) {
    console.error('packages-preview:', e)
    return NextResponse.json({ packages: [] })
  }
}
