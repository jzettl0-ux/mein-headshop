/**
 * Blueprint TEIL 16: Shoppable Editorials – GET Liste | POST neu
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Shoppable Editorials mit Hotspot-Count */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ editorials: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: editorials, error } = await admin
      .schema('retail_media')
      .from('editorials')
      .select('editorial_id, title, hero_image_url, editorial_text, published_at')
      .order('published_at', { ascending: false })

    if (error) return NextResponse.json({ editorials: [] }, { status: 200 })

    const ids = (editorials ?? []).map((e) => (e as { editorial_id: string }).editorial_id)
    if (ids.length === 0) return NextResponse.json({ editorials: editorials ?? [] })

    const { data: hotspots } = await admin
      .schema('retail_media')
      .from('editorial_hotspots')
      .select('editorial_id')
      .in('editorial_id', ids)

    const countByEditorial = new Map<string, number>()
    ;(hotspots ?? []).forEach((h) => {
      const eid = (h as { editorial_id: string }).editorial_id
      countByEditorial.set(eid, (countByEditorial.get(eid) ?? 0) + 1)
    })

    const enriched = (editorials ?? []).map((e) => ({
      ...e,
      hotspot_count: countByEditorial.get((e as { editorial_id: string }).editorial_id) ?? 0,
    }))

    return NextResponse.json({ editorials: enriched })
  } catch {
    return NextResponse.json({ editorials: [] }, { status: 200 })
  }
}

/** POST – Neues Editorial */
export async function POST(request: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const title = String(body.title ?? '').trim()
  const heroImageUrl = String(body.hero_image_url ?? '').trim()
  if (!title || !heroImageUrl) return NextResponse.json({ error: 'title und hero_image_url erforderlich' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('retail_media')
    .from('editorials')
    .insert({
      title,
      hero_image_url: heroImageUrl.slice(0, 500),
      editorial_text: body.editorial_text?.trim() || null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
