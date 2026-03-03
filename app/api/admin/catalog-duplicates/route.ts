import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Liste Catalog Duplicates (Blueprint Phase 8: Deep Tech).
 * deep_tech.catalog_duplicates mit Produktinfos für Original/Duplikat.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  try {
    const admin = createSupabaseAdmin()
    const { data: rows, error } = await admin
      .schema('deep_tech')
      .from('catalog_duplicates')
      .select('duplicate_id, original_product_id, duplicate_product_id, image_phash, similarity_score, status, detected_at')
      .order('detected_at', { ascending: false })

    if (error) {
      console.error('[catalog-duplicates] list error:', error.message)
      return NextResponse.json({ duplicates: [] })
    }

    const productIds = [...new Set((rows ?? []).flatMap((r) => [r.original_product_id, r.duplicate_product_id]).filter(Boolean))]
    const productMap: Record<string, { name?: string; slug?: string }> = {}
    if (productIds.length > 0) {
      const { data: products } = await admin.from('products').select('id, name, slug').in('id', productIds)
      ;(products ?? []).forEach((p: { id: string; name?: string; slug?: string }) => {
        productMap[p.id] = { name: p.name, slug: p.slug }
      })
    }

    const duplicates = (rows ?? []).map((r) => ({
      ...r,
      original_name: productMap[r.original_product_id]?.name,
      original_slug: productMap[r.original_product_id]?.slug,
      duplicate_name: productMap[r.duplicate_product_id]?.name,
      duplicate_slug: productMap[r.duplicate_product_id]?.slug,
    }))

    return NextResponse.json({ duplicates })
  } catch (e) {
    console.error('[catalog-duplicates] error:', e)
    return NextResponse.json({ duplicates: [] })
  }
}
