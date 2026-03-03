import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Search Autocomplete Analytics (Top-Suchbegriffe) */
export async function GET(request: Request) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ topTerms: [], totalEvents: 0 }, { status: 200 })

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200)

    const admin = createSupabaseAdmin()
    const { data: raw, error } = await admin
      .schema('frontend_ux')
      .from('search_autocomplete_analytics')
      .select('partial_search_term, clicked_product_id, conversion_from_search, event_timestamp')
      .order('event_timestamp', { ascending: false })
      .limit(5000)

    if (error) return NextResponse.json({ topTerms: [], totalEvents: 0 }, { status: 200 })

    const byTerm: Record<string, { count: number; clicks: number; conversions: number }> = {}
    ;(raw ?? []).forEach((r) => {
      const t = ((r as { partial_search_term: string }).partial_search_term || '').trim().toLowerCase()
      if (!t) return
      if (!byTerm[t]) byTerm[t] = { count: 0, clicks: 0, conversions: 0 }
      byTerm[t].count++
      if ((r as { clicked_product_id: string | null }).clicked_product_id) byTerm[t].clicks++
      if ((r as { conversion_from_search: boolean }).conversion_from_search) byTerm[t].conversions++
    })

    const topTerms = Object.entries(byTerm)
      .map(([term, v]) => ({ term, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return NextResponse.json({
      topTerms,
      totalEvents: raw?.length ?? 0,
    })
  } catch {
    return NextResponse.json({ topTerms: [], totalEvents: 0 }, { status: 200 })
  }
}
