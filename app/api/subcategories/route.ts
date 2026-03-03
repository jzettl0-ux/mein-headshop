import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import type { ProductCategory } from '@/lib/types'

const VALID_PARENTS: ProductCategory[] = ['bongs', 'grinder', 'papers', 'vaporizer', 'zubehoer', 'influencer-drops']

export const dynamic = 'force-dynamic'

/** GET – öffentlich: Unterkategorien, optional gefiltert nach parent_category */
export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { searchParams } = new URL(req.url)
    const parent = searchParams.get('parent')

    let query = supabase
      .from('product_subcategories')
      .select('id, parent_category, slug, name, sort_order')
      .order('sort_order', { ascending: true })

    if (parent && VALID_PARENTS.includes(parent as ProductCategory)) {
      query = query.eq('parent_category', parent)
    }

    const { data, error } = await query

    if (error) {
      console.error('subcategories GET:', error)
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
