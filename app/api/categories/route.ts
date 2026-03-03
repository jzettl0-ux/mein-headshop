import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

function getDefaultCategories() {
  return [
    { slug: 'bongs', name: 'Bongs', sort_order: 0 },
    { slug: 'grinder', name: 'Grinder', sort_order: 1 },
    { slug: 'papers', name: 'Papers & Filter', sort_order: 2 },
    { slug: 'vaporizer', name: 'Vaporizer', sort_order: 3 },
    { slug: 'zubehoer', name: 'Zubehör', sort_order: 4 },
    { slug: 'influencer-drops', name: 'Influencer Drops', sort_order: 5 },
  ]
}

/** GET – öffentlich: Alle Hauptkategorien (für Shop, Filter, Header) */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('product_categories')
      .select('slug, name, sort_order')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('categories GET:', error)
      return NextResponse.json(getDefaultCategories(), { status: 200 })
    }

    const result = data ?? []
    if (result.length === 0) return NextResponse.json(getDefaultCategories(), { status: 200 })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(getDefaultCategories(), { status: 200 })
  }
}
