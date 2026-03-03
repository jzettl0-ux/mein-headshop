import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminContext } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET – Admin: alle Vorschläge, optional gefiltert nach Status
 */
export async function GET(req: NextRequest) {
  try {
    const { isAdmin } = await getAdminContext()
    if (!isAdmin || !hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const admin = createSupabaseAdmin()
    let q = admin
      .from('shop_suggestions')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      q = q.eq('status', status)
    }
    if (type && type !== 'all') {
      q = q.eq('suggestion_type', type)
    }

    const { data, error } = await q

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('[Admin Suggestions] GET:', e)
    return NextResponse.json({ error: 'Fehler beim Laden.' }, { status: 500 })
  }
}

/**
 * PATCH – Admin: Vorschlag aktualisieren (Status, admin_notes, Verknüpfung)
 */
export async function PATCH(req: NextRequest) {
  try {
    const { user, isAdmin } = await getAdminContext()
    if (!isAdmin || !user || !hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const id = typeof body.id === 'string' ? body.id : null
    if (!id) {
      return NextResponse.json({ error: 'id fehlt.' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (typeof body.status === 'string' && ['new', 'reviewing', 'in_progress', 'implemented', 'rejected'].includes(body.status)) {
      updates.status = body.status
      if (body.status === 'implemented') {
        updates.implemented_at = new Date().toISOString()
        updates.implemented_by = user.id
      }
    }
    if (typeof body.admin_notes === 'string') {
      updates.admin_notes = body.admin_notes.slice(0, 2000)
    }
    if (body.linked_id != null) {
      updates.linked_id = body.linked_id
    }
    if (typeof body.linked_type === 'string' && ['category', 'subcategory', 'product', 'page', 'other'].includes(body.linked_type)) {
      updates.linked_type = body.linked_type
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Keine gültigen Änderungen.' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .from('shop_suggestions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('[Admin Suggestions] PATCH:', e)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren.' }, { status: 500 })
  }
}
