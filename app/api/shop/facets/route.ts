/**
 * GET /api/shop/facets?category=slug
 * Liefert Category-Facet-Config für die gewählte Kategorie (storefront.category_facet_config + facet_predefined_values).
 * category = product_categories.slug (z. B. bongs, vaporizer).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const categorySlug = request.nextUrl.searchParams.get('category')?.trim()
  if (!categorySlug) return NextResponse.json({ facets: [] })

  if (!hasSupabaseAdmin()) return NextResponse.json({ facets: [] })

  const admin = createSupabaseAdmin()

  const { data: cat } = await admin
    .from('product_categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle()

  if (!cat?.id) return NextResponse.json({ facets: [] })

  const { data: configs, error } = await admin
    .schema('storefront')
    .from('category_facet_config')
    .select('config_id, jsonb_attribute_key, display_label, ui_component_type, sort_order')
    .eq('category_id', (cat as { id: string }).id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !configs?.length) return NextResponse.json({ facets: [] })

  const configIds = configs.map((c) => (c as { config_id: string }).config_id)
  const { data: values } = await admin
    .schema('storefront')
    .from('facet_predefined_values')
    .select('config_id, attribute_value, display_label, sort_order')
    .in('config_id', configIds)
    .order('sort_order', { ascending: true })

  const valuesByConfig = new Map<string, { attribute_value: string; display_label: string }[]>()
  ;(values ?? []).forEach((v: { config_id: string; attribute_value: string; display_label: string }) => {
    const arr = valuesByConfig.get(v.config_id) ?? []
    arr.push({ attribute_value: v.attribute_value, display_label: v.display_label })
    valuesByConfig.set(v.config_id, arr)
  })

  const facets = configs.map((c) => {
    const cfg = c as { config_id: string; jsonb_attribute_key: string; display_label: string; ui_component_type: string }
    return {
      config_id: cfg.config_id,
      attribute_key: cfg.jsonb_attribute_key,
      display_label: cfg.display_label,
      ui_component_type: cfg.ui_component_type,
      values: valuesByConfig.get(cfg.config_id) ?? [],
    }
  })

  return NextResponse.json({ facets })
}
