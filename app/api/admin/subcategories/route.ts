import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/** GET – Admin: alle Unterkategorien, optional gefiltert */
export async function GET(req: Request) {
  try {
    const { isAdmin } = await getAdminContext()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabase()
    const { searchParams } = new URL(req.url)
    const parent = searchParams.get('parent')

    let query = supabase
      .from('product_subcategories')
      .select('*')
      .order('parent_category')
      .order('sort_order', { ascending: true })

    if (parent && typeof parent === 'string' && parent.trim()) {
      query = query.eq('parent_category', parent.trim())
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('admin subcategories GET:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}

/** POST – Admin: neue Unterkategorie */
export async function POST(req: Request) {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabase()
    const body = await req.json()
    const { parent_category, slug, name, sort_order } = body

    if (!parent_category || !slug || !name) {
      return NextResponse.json({ error: 'parent_category, slug und name erforderlich' }, { status: 400 })
    }

    const parentSlug = String(parent_category).trim()
    const { data: catRows } = await supabase.from('product_categories').select('id').eq('slug', parentSlug)
    const validSlugs = ['bongs', 'grinder', 'papers', 'vaporizer', 'zubehoer', 'influencer-drops']
    const isValid = (catRows && catRows.length > 0) || validSlugs.includes(parentSlug)
    if (!isValid) {
      return NextResponse.json({ error: 'parent_category muss eine existierende Hauptkategorie sein' }, { status: 400 })
    }

    const insert = {
      parent_category: String(parent_category).trim(),
      slug: String(slug).trim().toLowerCase().replace(/\s+/g, '-'),
      name: String(name).trim(),
      sort_order: typeof sort_order === 'number' ? sort_order : 0,
    }

    const { data, error } = await supabase
      .from('product_subcategories')
      .insert(insert)
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e) {
    console.error('admin subcategories POST:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}

/** PATCH – Admin: Unterkategorie aktualisieren */
export async function PATCH(req: Request) {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabase()
    const body = await req.json()
    const { id, slug, name, sort_order } = body

    if (!id) {
      return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (slug !== undefined) updates.slug = String(slug).trim().toLowerCase().replace(/\s+/g, '-')
    if (name !== undefined) updates.name = String(name).trim()
    if (typeof sort_order === 'number') updates.sort_order = sort_order

    const { error } = await supabase
      .from('product_subcategories')
      .update(updates)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin subcategories PATCH:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}

/** DELETE – Admin: Unterkategorie löschen */
export async function DELETE(req: Request) {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabase()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
    }

    const { error } = await supabase.from('product_subcategories').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin subcategories DELETE:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}
