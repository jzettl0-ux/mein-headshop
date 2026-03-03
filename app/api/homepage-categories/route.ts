import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/** GET – öffentlich: alle Startseiten-Kategorien für "Was suchst du?" */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('homepage_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('homepage-categories GET:', error)
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
