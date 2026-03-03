import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Category Facet Config (dynamische Filter pro Kategorie) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ configs: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: configs, error } = await admin
      .schema('storefront')
      .from('category_facet_config')
      .select('config_id, category_id, jsonb_attribute_key, display_label, ui_component_type, sort_order, is_active')
      .order('sort_order', { ascending: true })
      .order('display_label', { ascending: true })

    if (error) {
      console.error('[category-facets]', error.message)
      return NextResponse.json({ configs: [] })
    }

    const categoryIds = [...new Set((configs ?? []).map((c) => c.category_id).filter(Boolean))]
    const categoryNames: Record<string, string> = {}
    if (categoryIds.length > 0) {
      const { data: cats } = await admin.from('product_categories').select('id, name').in('id', categoryIds)
      ;(cats ?? []).forEach((c: { id: string; name: string }) => { categoryNames[c.id] = c.name })
    }

    const list = (configs ?? []).map((c) => ({
      ...c,
      category_name: categoryNames[c.category_id] ?? c.category_id,
    }))
    return NextResponse.json({ configs: list })
  } catch (e) {
    console.error('[category-facets]', e)
    return NextResponse.json({ configs: [] })
  }
}
