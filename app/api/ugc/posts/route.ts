/**
 * GET – Öffentliche UGC-Posts (Rate my Setup), nur PUBLISHED
 */
import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!hasSupabaseAdmin()) return NextResponse.json([])

  try {
    const admin = createSupabaseAdmin()
    const { data: posts, error } = await admin
      .schema('community')
      .from('ugc_posts')
      .select('post_id, image_url, caption, likes_count, created_at')
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json([])

    const list = posts ?? []
    if (list.length === 0) return NextResponse.json([])

    const postIds = list.map((p) => p.post_id)
    const { data: allHotspots } = await admin
      .schema('community')
      .from('ugc_hotspots')
      .select('hotspot_id, post_id, product_id, x_coordinate, y_coordinate')
      .in('post_id', postIds)
    const hotspotsByPost = new Map<string, { hotspot_id: string; product_id: string; x_coordinate: number; y_coordinate: number }[]>()
    const productIds = new Set<string>()
    for (const h of allHotspots ?? []) {
      const arr = hotspotsByPost.get(h.post_id) ?? []
      arr.push({ hotspot_id: h.hotspot_id, product_id: h.product_id, x_coordinate: h.x_coordinate, y_coordinate: h.y_coordinate })
      hotspotsByPost.set(h.post_id, arr)
      productIds.add(h.product_id)
    }

    const productMap = new Map<string, { name: string; slug: string; price: number }>()
    if (productIds.size > 0) {
      const { data: prods } = await admin.from('products').select('id, name, slug, price').in('id', Array.from(productIds))
      for (const pr of prods ?? []) productMap.set(pr.id, { name: pr.name, slug: pr.slug, price: Number(pr.price) })
    }

    const enriched = list.map((p) => ({
      ...p,
      hotspots: (hotspotsByPost.get(p.post_id) ?? []).map((h) => ({
        ...h,
        product: productMap.get(h.product_id) ?? null,
      })),
    }))

    return NextResponse.json(enriched)
  } catch {
    return NextResponse.json([])
  }
}
