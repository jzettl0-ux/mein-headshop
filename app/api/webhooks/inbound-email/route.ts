import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/**
 * Extrahiert ID aus To-Adresse: reply+{id}@ oder beschwerde+{id}@
 */
function parseInboundTo(toAddresses: string[]): { type: 'inquiry'; id: string } | { type: 'complaint'; id: string } | null {
  const replyPrefix = (process.env.RESEND_INBOUND_REPLY_PREFIX || 'reply').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const complaintPrefix = (process.env.RESEND_INBOUND_COMPLAINT_PREFIX || 'beschwerde').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  for (const to of toAddresses) {
    const s = String(to)
    const replyMatch = s.match(new RegExp(`${replyPrefix}\\+([a-f0-9-]{36})@`, 'i'))
    if (replyMatch) return { type: 'inquiry', id: replyMatch[1] }
    const complaintMatch = s.match(new RegExp(`${complaintPrefix}\\+([a-f0-9-]{36})@`, 'i'))
    if (complaintMatch) return { type: 'complaint', id: complaintMatch[1] }
  }
  return null
}

/**
 * Resend Inbound Webhook: type = "email.received".
 * Unterstützt:
 * - reply+{inquiryId}@… → Kunden-Antwort in inquiry_messages
 * - beschwerde+{complaintId}@… → Mitarbeiter-Antwort in staff_complaint_messages
 */
export async function POST(req: NextRequest) {
  if (!resend || !hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  try {
    const body = await req.json().catch(() => ({}))
    if (body.type !== 'email.received' || !body.data?.email_id) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }
    const emailId = body.data.email_id as string
    const toRaw = body.data.to
    const toAddresses = Array.isArray(toRaw) ? toRaw : typeof toRaw === 'string' ? [toRaw] : []
    const parsed = parseInboundTo(toAddresses)
    if (!parsed) {
      console.warn('[inbound-email] No inquiry/complaint id in To:', toAddresses)
      return NextResponse.json({ ok: false, error: 'No inquiry or complaint id in To address' }, { status: 400 })
    }

    const receiving = (resend as any).emails?.receiving
    const { data: email } = receiving ? await receiving.get(emailId) : { data: null }
    const text = (email as any)?.text?.trim() || ((email as any)?.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || ''
    if (!text) return NextResponse.json({ ok: false, error: 'No body' }, { status: 400 })

    const admin = createSupabaseAdmin()

    if (parsed.type === 'complaint') {
      const { data: complaint } = await admin.from('staff_complaints').select('id, author_email').eq('id', parsed.id).single()
      if (!complaint) return NextResponse.json({ ok: false, error: 'Complaint not found' }, { status: 404 })
      const fromRaw = body.data?.from
      const fromEmail = typeof fromRaw === 'string' ? fromRaw : (fromRaw as any)?.email ?? complaint.author_email
      await admin.from('staff_complaint_messages').insert({
        complaint_id: parsed.id,
        author_type: 'staff',
        author_email: typeof fromEmail === 'string' ? fromEmail : complaint.author_email,
        message: text.slice(0, 50000),
      })
      return NextResponse.json({ ok: true, complaintId: parsed.id })
    }

    const { data: inquiry } = await admin.from('customer_inquiries').select('id, email, name').eq('id', parsed.id).single()
    if (!inquiry) return NextResponse.json({ ok: false, error: 'Inquiry not found' }, { status: 404 })

    await admin.from('inquiry_messages').insert({
      inquiry_id: parsed.id,
      author_type: 'customer',
      author_email: inquiry.email,
      author_name: inquiry.name,
      message: text.slice(0, 50000),
    })

    return NextResponse.json({ ok: true, inquiryId: parsed.id })
  } catch (e) {
    console.error('[inbound-email]', e)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
