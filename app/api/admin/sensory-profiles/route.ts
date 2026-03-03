import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Sensory Profiles (Terpen-Visualizer) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ profiles: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: profiles, error } = await admin
      .schema('catalog')
      .from('sensory_profiles')
      .select('profile_id, product_id, chart_type, data_points, ui_color_hex, updated_at')
      .order('updated_at', { ascending: false })

    if (error) return NextResponse.json({ profiles: [] }, { status: 200 })

    const productIds = [...new Set((profiles ?? []).map((p) => (p as { product_id: string }).product_id).filter(Boolean))]
    let byId = new Map<string, { name: string; slug: string | null }>()
    if (productIds.length > 0) {
      const { data: products } = await admin.from('products').select('id, name, slug').in('id', productIds)
      byId = new Map((products ?? []).map((p) => [p.id, { name: p.name, slug: p.slug }]))
    }

    const enriched = (profiles ?? []).map((p) => ({
      ...p,
      product_name: byId.get((p as { product_id: string }).product_id)?.name ?? '–',
      product_slug: byId.get((p as { product_id: string }).product_id)?.slug ?? null,
    }))

    return NextResponse.json({ profiles: enriched })
  } catch {
    return NextResponse.json({ profiles: [] }, { status: 200 })
  }
}
