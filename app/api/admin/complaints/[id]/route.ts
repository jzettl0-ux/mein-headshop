import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendComplaintReplyEmail } from '@/lib/send-order-email'

export const dynamic = 'force-dynamic'

/**
 * GET – Eine Beschwerde inkl. Nachrichtenverlauf laden (nur Inhaber/Chef).
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isStaffManager } = await getAdminContext()
  if (!isStaffManager) return NextResponse.json({ error: 'Nur Inhaber oder Chef können Beschwerden einsehen.' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: complaint, error } = await admin
    .from('staff_complaints')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !complaint) return NextResponse.json({ error: 'Beschwerde nicht gefunden' }, { status: 404 })

  const { data: messages } = await admin
    .from('staff_complaint_messages')
    .select('*')
    .eq('complaint_id', id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ ...complaint, messages: Array.isArray(messages) ? messages : [] })
}

/**
 * PATCH – Beschwerde bearbeiten: read_at, Antwort schreiben, optional E-Mail senden.
 * Body: { read_at?: string | null, reply_text?: string, send_email?: boolean }
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { user, isStaffManager } = await getAdminContext()
  if (!isStaffManager) return NextResponse.json({ error: 'Nur Inhaber oder Chef können Beschwerden bearbeiten.' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const readAt = body.read_at === null || body.read_at === '' ? null : (body.read_at ?? new Date().toISOString())
  const replyText = typeof body.reply_text === 'string' ? body.reply_text.trim() : ''
  const sendEmail = body.send_email === true

  const admin = createSupabaseAdmin()
  const { data: complaint } = await admin.from('staff_complaints').select('*').eq('id', id).single()
  if (!complaint) return NextResponse.json({ error: 'Beschwerde nicht gefunden' }, { status: 404 })

  const updates: Record<string, unknown> = {}
  if (readAt !== undefined) updates.read_at = readAt

  if (replyText) {
    await admin.from('staff_complaint_messages').insert({
      complaint_id: id,
      author_type: 'owner_chef',
      author_email: user?.email ?? null,
      message: replyText,
    })
    if (readAt === undefined) updates.read_at = new Date().toISOString()
  }

  if (sendEmail && replyText && complaint.author_email) {
    const sent = await sendComplaintReplyEmail({
      to: complaint.author_email,
      subject: `Re: ${complaint.subject || 'Deine Beschwerde'}`,
      replyText,
      complaintSubject: complaint.subject,
      complaintId: id,
    })
    if (!sent.ok) {
      return NextResponse.json({ error: sent.error || 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
    }
  }

  if (Object.keys(updates).length > 0) {
    const { data: updated, error } = await admin
      .from('staff_complaints')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const { data: messages } = await admin
      .from('staff_complaint_messages')
      .select('*')
      .eq('complaint_id', id)
      .order('created_at', { ascending: true })
    return NextResponse.json({ ...updated, messages: Array.isArray(messages) ? messages : [] })
  }

  const { data: messages } = await admin
    .from('staff_complaint_messages')
    .select('*')
    .eq('complaint_id', id)
    .order('created_at', { ascending: true })
  return NextResponse.json({ ...complaint, messages: Array.isArray(messages) ? messages : [] })
}
