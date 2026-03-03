import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendSupportReplyEmail } from '@/lib/send-order-email'

export const dynamic = 'force-dynamic'

/**
 * GET – Eine Kundenanfrage laden.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: inquiry, error } = await admin.from('customer_inquiries').select('*').eq('id', id).single()
  if (error || !inquiry) return NextResponse.json({ error: 'Anfrage nicht gefunden' }, { status: 404 })

  const { data: messages } = await admin
    .from('inquiry_messages')
    .select('*')
    .eq('inquiry_id', id)
    .order('created_at', { ascending: true })

  const list = Array.isArray(messages) ? messages : []
  if (list.length === 0 && (inquiry as any).reply_text) {
    list.push({
      id: null,
      inquiry_id: id,
      author_type: 'staff',
      author_email: (inquiry as any).replied_by ?? null,
      author_name: null,
      message: (inquiry as any).reply_text,
      created_at: (inquiry as any).replied_at ?? (inquiry as any).updated_at,
    })
  }
  return NextResponse.json({ ...inquiry, messages: list })
}

/**
 * PATCH – Status ändern und optional Antwort per E-Mail senden.
 * Body: { status?: 'open'|'answered'|'closed', reply_text?: string, send_email?: boolean }
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { user, isAdmin } = await getAdminContext()
  if (!user || !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const status = typeof body.status === 'string' && ['open', 'answered', 'closed'].includes(body.status) ? body.status : undefined
  const replyText = typeof body.reply_text === 'string' ? body.reply_text.trim() : ''
  const sendEmail = body.send_email === true
  const customerMessage = typeof body.customer_message === 'string' ? body.customer_message.trim() : ''

  const admin = createSupabaseAdmin()
  const { data: inquiry } = await admin.from('customer_inquiries').select('*').eq('id', id).single()
  if (!inquiry) return NextResponse.json({ error: 'Anfrage nicht gefunden' }, { status: 404 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (customerMessage) {
    await admin.from('inquiry_messages').insert({
      inquiry_id: id,
      author_type: 'customer',
      author_email: inquiry.email,
      author_name: inquiry.name,
      message: customerMessage,
    })
  }
  if (status) updates.status = status
  if (replyText) {
    updates.reply_text = replyText
    updates.replied_at = new Date().toISOString()
    updates.replied_by = user.email
    if (status === undefined) updates.status = 'answered'

    await admin.from('inquiry_messages').insert({
      inquiry_id: id,
      author_type: 'staff',
      author_email: user.email,
      author_name: null,
      message: replyText,
    })
  }

  if (sendEmail && replyText && inquiry.email) {
    const sent = await sendSupportReplyEmail({
      to: inquiry.email,
      subject: `Re: ${inquiry.subject || 'Deine Anfrage'}`,
      replyText,
      inquirySubject: inquiry.subject,
      customerName: inquiry.name,
      inquiryId: id,
    })
    if (!sent.ok) {
      return NextResponse.json({ error: sent.error || 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
    }
  }

  const { data: updated, error } = await admin
    .from('customer_inquiries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: messages } = await admin
    .from('inquiry_messages')
    .select('*')
    .eq('inquiry_id', id)
    .order('created_at', { ascending: true })
  return NextResponse.json({ ...updated, messages: Array.isArray(messages) ? messages : [] })
}
