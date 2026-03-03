import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * POST – Neuen Gruppenchat anlegen.
 * Body: { name: string, staff_ids: string[] }
 * Der aufrufende Mitarbeiter wird automatisch Teilnehmer, wenn nicht in staff_ids.
 */
export async function POST(req: NextRequest) {
  const { staff, isAdmin } = await getAdminContext()
  if (!staff || !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  let staffIds = Array.isArray(body.staff_ids) ? body.staff_ids.filter((id: unknown) => typeof id === 'string') as string[] : []
  if (!name) return NextResponse.json({ error: 'name erforderlich' }, { status: 400 })
  if (!staffIds.includes(staff.id)) staffIds = [staff.id, ...staffIds]
  staffIds = [...new Set(staffIds)]

  const admin = createSupabaseAdmin()
  const { data: active } = await admin.from('staff').select('id').in('id', staffIds).eq('is_active', true)
  const validIds = (active ?? []).map((r: { id: string }) => r.id)
  if (validIds.length === 0) return NextResponse.json({ error: 'Mindestens ein gültiger Teilnehmer nötig' }, { status: 400 })

  const { data: conv, error: convErr } = await admin
    .from('staff_conversations')
    .insert({ name, is_group: true })
    .select('id, name, created_at')
    .single()
  if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500 })

  const participants = validIds.map((id: string) => ({ conversation_id: conv.id, staff_id: id }))
  const { error: partErr } = await admin.from('staff_conversation_participants').insert(participants)
  if (partErr) return NextResponse.json({ error: partErr.message }, { status: 500 })

  return NextResponse.json({ id: conv.id, name: conv.name, created_at: conv.created_at })
}
