/**
 * GET /api/shop/loyalty-gated-categories
 * Öffentlich: Kategorien mit min_loyalty_tier_required > 1 (Secret Shop).
 * Gibt category slugs zurück, die nur für bestimmte Loyalty-Tiers sichtbar sind.
 */
import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!hasSupabaseAdmin()) return NextResponse.json([])

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('admin')
      .from('gated_categories')
      .select('min_loyalty_tier_required, product_categories(slug)')
      .gt('min_loyalty_tier_required', 1)

    if (error) return NextResponse.json([])

    const list = (data ?? [])
      .filter((r) => {
        const pc = (r as Record<string, unknown>).product_categories
        const slug = Array.isArray(pc) ? (pc[0] as { slug?: string })?.slug : (pc as { slug?: string })?.slug
        return !!slug
      })
      .map((r) => {
        const pc = (r as Record<string, unknown>).product_categories
        const slug = Array.isArray(pc) ? (pc[0] as { slug?: string })?.slug : (pc as { slug?: string })?.slug
        return {
          slug: slug ?? '',
          min_tier: Number((r as { min_loyalty_tier_required?: number }).min_loyalty_tier_required) || 2,
        }
      })

    return NextResponse.json(list)
  } catch {
    return NextResponse.json([])
  }
}
