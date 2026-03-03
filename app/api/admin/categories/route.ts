import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Admin: Alle Hauptkategorien */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('product_categories')
    .select('id, slug, name, sort_order')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('admin categories GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

/** POST – Admin: Neue Hauptkategorie */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { slug, name, sort_order } = body

  if (!slug || !name || typeof slug !== 'string' || typeof name !== 'string') {
    return NextResponse.json({ error: 'slug und name erforderlich' }, { status: 400 })
  }

  const slugClean = String(slug).trim().toLowerCase().replace(/\s+/g, '-')
  if (!slugClean) return NextResponse.json({ error: 'Ungültiger Slug' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('product_categories')
    .insert({
      slug: slugClean,
      name: String(name).trim(),
      sort_order: typeof sort_order === 'number' ? sort_order : 0,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Kategorie mit diesem Slug existiert bereits' }, { status: 400 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data?.id })
}

/** PATCH – Admin: Kategorie aktualisieren */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { id, slug, name, sort_order } = body

  if (!id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof slug === 'string' && slug.trim()) {
    updates.slug = slug.trim().toLowerCase().replace(/\s+/g, '-')
  }
  if (typeof name === 'string' && name.trim()) updates.name = name.trim()
  if (typeof sort_order === 'number') updates.sort_order = sort_order

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: 'Keine Änderungen' }, { status: 400 })
  }

  const { error } = await admin
    .from('product_categories')
    .update(updates)
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Kategorie mit diesem Slug existiert bereits' }, { status: 400 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/** DELETE – Admin: Kategorie löschen */
export async function DELETE(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()

  const { data: cat } = await admin.from('product_categories').select('slug').eq('id', id).single()
  if (cat?.slug) {
    const { count } = await admin.from('products').select('id', { count: 'exact', head: true }).eq('category', cat.slug)
    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: `Es gibt noch ${count} Produkt(e) in dieser Kategorie. Ändere zuerst die Zuordnung der Produkte.` },
        { status: 400 }
      )
    }
  }

  const { error } = await admin.from('product_categories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
