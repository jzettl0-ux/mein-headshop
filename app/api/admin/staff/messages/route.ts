import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const roleLabels: Record<string, string> = {
  owner: 'Inhaber',
  chef: 'Chef',
  admin: 'Admin',
  product_care: 'Produktpflege',
  support: 'Kundenservice',
  employee: 'Mitarbeiter',
  hr: 'Personal',
  team_leader: 'Teamleiter',
  warehouse_lead: 'Lagerleitung',
  marketing: 'Marketing',
}

function toLabel(r: { first_name?: string | null; last_name?: string | null; email: string; roles?: string[] }) {
  const name = [r.first_name, r.last_name].filter(Boolean).join(' ').trim()
  return name || r.email
}

/**
 * GET – Konversationen auflisten oder Nachrichten mit einer Person laden.
 * ?with=STAFF_ID → Nachrichten mit dieser Person (chronologisch).
 * Ohne with → Liste der Konversationen (andere Mitarbeiter + letzte Nachricht + ungelesen).
 */
export async function GET(req: NextRequest) {
  const { staff, isAdmin } = await getAdminContext()
  if (!staff || !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const withId = req.nextUrl.searchParams.get('with')
  const conversationId = req.nextUrl.searchParams.get('conversation')

  // 1:1 Nachrichten mit einer Person
  if (withId) {
    const { data: messages, error } = await admin
      .from('staff_messages')
      .select('id, from_staff_id, to_staff_id, body, read_at, created_at')
      .is('conversation_id', null)
      .or(`and(from_staff_id.eq.${staff.id},to_staff_id.eq.${withId}),and(from_staff_id.eq.${withId},to_staff_id.eq.${staff.id})`)
      .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await admin.from('staff_messages').update({ read_at: new Date().toISOString() }).eq('to_staff_id', staff.id).eq('from_staff_id', withId).is('read_at', null)
    const { data: other } = await admin.from('staff').select('id, email, first_name, last_name, roles').eq('id', withId).eq('is_active', true).maybeSingle()
    if (!other) return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 })
    return NextResponse.json({
      messages: messages ?? [],
      other: { id: other.id, email: other.email, label: toLabel(other), role_hint: (other.roles?.[0] && roleLabels[other.roles[0]]) || 'Mitarbeiter' },
    })
  }

  // Gruppenchat-Nachrichten
  if (conversationId) {
    const { data: participant } = await admin.from('staff_conversation_participants').select('conversation_id').eq('conversation_id', conversationId).eq('staff_id', staff.id).maybeSingle()
    if (!participant) return NextResponse.json({ error: 'Kein Zugriff auf diese Konversation' }, { status: 403 })
    const { data: conv } = await admin.from('staff_conversations').select('id, name').eq('id', conversationId).maybeSingle()
    if (!conv) return NextResponse.json({ error: 'Konversation nicht gefunden' }, { status: 404 })
    const { data: messages, error } = await admin
      .from('staff_messages')
      .select('id, from_staff_id, to_staff_id, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const senderIds = [...new Set((messages ?? []).map((m: { from_staff_id: string }) => m.from_staff_id))]
    const { data: senders } = await admin.from('staff').select('id, email, first_name, last_name').in('id', senderIds)
    const senderMap = new Map((senders ?? []).map((s: { id: string }) => [s.id, s]))
    const { data: participants } = await admin.from('staff_conversation_participants').select('staff_id').eq('conversation_id', conversationId)
    const { data: partRows } = await admin.from('staff').select('id, email, first_name, last_name, roles').in('id', (participants ?? []).map((p: { staff_id: string }) => p.staff_id))
    const partLabels = new Map((partRows ?? []).map((p: { id: string; email: string; first_name?: string | null; last_name?: string | null }) => [p.id, toLabel(p)]))
    return NextResponse.json({
      my_staff_id: staff.id,
      messages: (messages ?? []).map((m: { id: string; from_staff_id: string; body: string; created_at: string }) => ({
        id: m.id,
        from_staff_id: m.from_staff_id,
        body: m.body,
        created_at: m.created_at,
        from_label: senderMap.get(m.from_staff_id) ? toLabel(senderMap.get(m.from_staff_id) as { first_name?: string | null; last_name?: string | null; email: string }) : m.from_staff_id.slice(0, 8),
      })),
      conversation: { id: conv.id, name: conv.name || 'Gruppenchat', participants: (participants ?? []).map((p: { staff_id: string }) => ({ staff_id: p.staff_id, label: partLabels.get(p.staff_id) ?? p.staff_id.slice(0, 8) })) },
    })
  }

  // Liste: 1:1-Konversationen (nur Nachrichten ohne conversation_id)
  const { data: allMessages } = await admin
    .from('staff_messages')
    .select('id, from_staff_id, to_staff_id, body, read_at, created_at')
    .is('conversation_id', null)
    .or(`from_staff_id.eq.${staff.id},to_staff_id.eq.${staff.id}`)
    .order('created_at', { ascending: false })

  const list = (allMessages ?? []) as { id: string; from_staff_id: string; to_staff_id: string; body: string; read_at: string | null; created_at: string }[]
  const otherIds = new Set<string>()
  list.forEach((m) => {
    const o = m.from_staff_id === staff.id ? m.to_staff_id : m.from_staff_id
    if (o) otherIds.add(o)
  })

  const { data: staffRows } = await admin.from('staff').select('id, email, first_name, last_name, roles').in('id', [...otherIds]).eq('is_active', true)
  const staffMap = new Map((staffRows ?? []).map((s: { id: string }) => [s.id, s]))

  const conversations: { type: 'dm'; staff_id: string; label: string; role_hint: string; last_message: string; last_at: string; unread: number }[] = []
  otherIds.forEach((id) => {
    const first = list.find((m) => (m.from_staff_id === staff.id ? m.to_staff_id === id : m.from_staff_id === id))
    const unread = list.filter((m) => m.to_staff_id === staff.id && m.from_staff_id === id && !m.read_at).length
    const s = staffMap.get(id) as { id: string; email: string; first_name?: string | null; last_name?: string | null; roles?: string[] } | undefined
    conversations.push({
      type: 'dm',
      staff_id: id,
      label: s ? toLabel(s) : id.slice(0, 8),
      role_hint: s?.roles?.[0] && roleLabels[s.roles[0]] ? roleLabels[s.roles[0]] : 'Mitarbeiter',
      last_message: first?.body?.slice(0, 80) ?? '',
      last_at: first?.created_at ?? '',
      unread,
    })
  })

  // Gruppenkonversationen, an denen ich teilnehme
  const { data: myConvs } = await admin.from('staff_conversation_participants').select('conversation_id').eq('staff_id', staff.id)
  const convIds = (myConvs ?? []).map((c: { conversation_id: string }) => c.conversation_id)
  if (convIds.length > 0) {
    const { data: convRows } = await admin.from('staff_conversations').select('id, name').in('id', convIds)
    const { data: lastGroupMessages } = await admin
      .from('staff_messages')
      .select('id, conversation_id, from_staff_id, body, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })
    const lastByConv = new Map<string | null, { body: string; created_at: string }>()
    ;(lastGroupMessages ?? []).forEach((m: { conversation_id: string | null; body: string; created_at: string }) => {
      if (m.conversation_id && !lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, { body: m.body, created_at: m.created_at })
    })
    ;(convRows ?? []).forEach((c: { id: string; name: string | null }) => {
      const last = lastByConv.get(c.id)
      conversations.push({
        type: 'group',
        conversation_id: c.id,
        label: c.name || 'Gruppenchat',
        last_message: last?.body?.slice(0, 80) ?? '',
        last_at: last?.created_at ?? '',
        unread: 0,
      } as { type: 'group'; conversation_id: string; label: string; last_message: string; last_at: string; unread: number })
    })
  }

  conversations.sort((a, b) => (b.last_at > a.last_at ? 1 : -1))

  const myReportsToId = (staff as { reports_to_id?: string | null }).reports_to_id ?? null
  const { data: colleagues } = await admin.from('staff').select('id, email, first_name, last_name, roles, reports_to_id').eq('is_active', true).neq('id', staff.id)
  const colleaguesList = (colleagues ?? []).map((c: { id: string; email: string; first_name?: string | null; last_name?: string | null; roles?: string[]; reports_to_id?: string | null }) => {
    let team_role: 'supervisor' | 'reports_to_me' | 'same_team' | null = null
    if (c.id === myReportsToId) team_role = 'supervisor'
    else if (c.reports_to_id === staff.id) team_role = 'reports_to_me'
    else if (myReportsToId && c.reports_to_id === myReportsToId) team_role = 'same_team'
    return {
      id: c.id,
      label: toLabel(c),
      email: c.email,
      role_hint: c.roles?.[0] && roleLabels[c.roles[0]] ? roleLabels[c.roles[0]] : 'Mitarbeiter',
      team_role,
    }
  })

  return NextResponse.json({
    conversations,
    colleagues: colleaguesList,
    my_supervisor_id: myReportsToId,
  })
}

/**
 * POST – Nachricht senden.
 * Body: { to_staff_id?: string, conversation_id?: string, body: string }
 * Entweder to_staff_id (1:1) oder conversation_id (Gruppe).
 */
export async function POST(req: NextRequest) {
  const { staff, isAdmin } = await getAdminContext()
  if (!staff || !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const toStaffId = body.to_staff_id
  const conversationId = body.conversation_id
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  if (!text) return NextResponse.json({ error: 'body erforderlich' }, { status: 400 })
  if (toStaffId && conversationId) return NextResponse.json({ error: 'Nur to_staff_id oder conversation_id angeben' }, { status: 400 })
  if (!toStaffId && !conversationId) return NextResponse.json({ error: 'to_staff_id oder conversation_id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()

  if (conversationId) {
    const { data: participant } = await admin.from('staff_conversation_participants').select('conversation_id').eq('conversation_id', conversationId).eq('staff_id', staff.id).maybeSingle()
    if (!participant) return NextResponse.json({ error: 'Kein Zugriff auf diese Konversation' }, { status: 403 })
    const { data: row, error } = await admin
      .from('staff_messages')
      .insert({ from_staff_id: staff.id, conversation_id: conversationId, body: text })
      .select('id, from_staff_id, body, created_at')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ...row, conversation_id: conversationId })
  }

  const { data: toRow } = await admin.from('staff').select('id').eq('id', toStaffId).eq('is_active', true).maybeSingle()
  if (!toRow) return NextResponse.json({ error: 'Empfänger nicht gefunden' }, { status: 404 })

  const { data: row, error } = await admin
    .from('staff_messages')
    .insert({ from_staff_id: staff.id, to_staff_id: toStaffId, body: text })
    .select('id, from_staff_id, to_staff_id, body, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(row)
}
