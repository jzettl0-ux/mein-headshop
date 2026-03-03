import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/** POST – Admin: neue Kategorie anlegen */
export async function POST(req: Request) {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabase()
    const body = await req.json()
    const { name, slug, description, gradient, icon_color, sort_order, gradient_start_hex, gradient_end_hex, icon_color_hex } = body
    if (!name || !slug) {
      return NextResponse.json({ error: 'name und slug erforderlich' }, { status: 400 })
    }

    const insert: Record<string, unknown> = {
      name: String(name).trim(),
      slug: String(slug).trim().toLowerCase().replace(/\s+/g, '-'),
      description: (description ?? '').trim() || '',
      gradient: (gradient ?? '').trim() || 'from-luxe-gold/20 to-yellow-500/20',
      icon_color: (icon_color ?? '').trim() || 'text-luxe-gold',
      sort_order: typeof sort_order === 'number' ? sort_order : 0,
    }
    if ((gradient_start_hex ?? '').trim()) insert.gradient_start_hex = String(gradient_start_hex).trim()
    if ((gradient_end_hex ?? '').trim()) insert.gradient_end_hex = String(gradient_end_hex).trim()
    if ((icon_color_hex ?? '').trim()) insert.icon_color_hex = String(icon_color_hex).trim()

    const { data, error } = await supabase
      .from('homepage_categories')
      .insert(insert)
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e) {
    console.error('admin homepage-categories POST:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}

/** PATCH – Admin: Kategorie aktualisieren */
export async function PATCH(req: Request) {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabase()
    const body = await req.json()
    const id = body.id
    if (!id) {
      return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) updates.name = String(body.name).trim()
    if (body.slug !== undefined) updates.slug = String(body.slug).trim().toLowerCase().replace(/\s+/g, '-')
    if (body.description !== undefined) updates.description = (body.description ?? '').trim() || ''
    if (body.gradient !== undefined) updates.gradient = (body.gradient ?? '').trim()
    if (body.icon_color !== undefined) updates.icon_color = (body.icon_color ?? '').trim()
    if (body.image_url !== undefined) updates.image_url = body.image_url || null
    if (typeof body.sort_order === 'number') updates.sort_order = body.sort_order
    if (body.gradient_start_hex !== undefined) updates.gradient_start_hex = (body.gradient_start_hex ?? '').trim() || null
    if (body.gradient_end_hex !== undefined) updates.gradient_end_hex = (body.gradient_end_hex ?? '').trim() || null
    if (body.icon_color_hex !== undefined) updates.icon_color_hex = (body.icon_color_hex ?? '').trim() || null

    const { error } = await supabase
      .from('homepage_categories')
      .update(updates)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin homepage-categories PATCH:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}

/** DELETE – Admin: Kategorie löschen */
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

    const { error } = await supabase.from('homepage_categories').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin homepage-categories DELETE:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}
