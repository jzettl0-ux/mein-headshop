import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/** GET – öffentlich: Influencer für die Startseite (show_on_homepage, Limit aus Settings) */
export async function GET() {
  try {
    const supabase = await createServerSupabase()

    // Limit aus site_settings
    let limit = 6
    const { data: settingsRows } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'homepage_influencer_limit')
    if (settingsRows?.[0]?.value) {
      const n = parseInt(settingsRows[0].value, 10)
      if (!Number.isNaN(n) && n >= 0) limit = Math.min(n, 12)
    }

    if (limit === 0) {
      return NextResponse.json([])
    }

    let data: unknown[] | null = null
    let error: { message: string } | null = null

    const { data: qData, error: qError } = await supabase
      .from('influencers')
      .select('*')
      .eq('show_on_homepage', true)
      .eq('is_active', true)
      .order('homepage_order', { ascending: true, nullsFirst: false })
      .limit(limit)

    data = qData
    error = qError

    if (error) {
      // Fallback: Spalten fehlen (Migration nicht ausgeführt) oder anderer Fehler – aktive Influencer laden
      console.warn('homepage-influencers GET:', error.message)
      const { data: fallback } = await supabase
        .from('influencers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
        .limit(limit)
      const list = Array.isArray(fallback) ? fallback : []
      const withHomepage = list.filter(
        (r: { show_on_homepage?: boolean }) => r.show_on_homepage === true || r.show_on_homepage === undefined
      )
      return NextResponse.json(withHomepage.slice(0, limit))
    }

    return NextResponse.json(data ?? [])
  } catch (e) {
    console.warn('homepage-influencers GET error:', e)
    return NextResponse.json([])
  }
}
