import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Admin: Alle Shop-Bewertungen */
export async function GET() {
  try {
    const { isAdmin } = await getAdminContext()
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('shop_reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('admin shop-reviews GET:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('admin shop-reviews GET:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}

/** POST – Admin: Neue Bewertung (z. B. Google-Review manuell anlegen) */
export async function POST(req: Request) {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) return NextResponse.json({ error: 'Nur Inhaber' }, { status: 403 })

    if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
    const supabase = createSupabaseAdmin()
    const body = await req.json().catch(() => ({}))
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5))
    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 2000) : ''
    const displayName = typeof body.display_name === 'string' ? body.display_name.trim().slice(0, 100) : ''
    const source = body.source === 'google' ? 'google' : 'customer'
    const status = body.moderation_status === 'approved' ? 'approved' : 'pending'

    if (!displayName) {
      return NextResponse.json({ error: 'Anzeigename erforderlich' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('shop_reviews')
      .insert({
        rating,
        comment: comment || null,
        display_name: displayName,
        source,
        moderation_status: status,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e) {
    console.error('admin shop-reviews POST:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}

/** PATCH – Admin: Bewertung bearbeiten (Freigabe, Ablehnung, Text) */
export async function PATCH(req: Request) {
  try {
    const { isAdmin } = await getAdminContext()
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
    const supabase = createSupabaseAdmin()
    const body = await req.json().catch(() => ({}))
    const id = body.id
    if (!id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.moderation_status && ['pending', 'approved', 'rejected'].includes(body.moderation_status)) {
      updates.moderation_status = body.moderation_status
    }
    if (body.comment !== undefined) updates.comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 2000) || null : null
    if (body.display_name !== undefined) updates.display_name = typeof body.display_name === 'string' ? body.display_name.trim().slice(0, 100) : undefined
    if (typeof body.rating === 'number' && body.rating >= 1 && body.rating <= 5) updates.rating = body.rating

    const { error } = await supabase.from('shop_reviews').update(updates).eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin shop-reviews PATCH:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}

/** DELETE – Admin: Bewertung löschen */
export async function DELETE(req: Request) {
  try {
    const { isAdmin } = await getAdminContext()
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
    const supabase = createSupabaseAdmin()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })

    const { error } = await supabase.from('shop_reviews').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin shop-reviews DELETE:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}
