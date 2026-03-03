import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'
import { wrapNewsletterHtml } from '@/lib/newsletter-email-template'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const BATCH_SIZE = 50
const RESEND_BATCH_LIMIT = 100

/**
 * POST – Newsletter an alle aktiven Abonnenten senden (Batch-Versand).
 * Body: { subject: string, body_html: string }
 * Speichert in newsletters, holt newsletter_subscribers (is_active = true), sendet in Batches.
 */
function getClientId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  return `newsletter-send:${ip}`
}

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const rl = checkRateLimit(getClientId(req), 3, 300)
  if (!rl.allowed) return NextResponse.json({ error: 'Versand-Limit. Bitte in 5 Minuten erneut versuchen.' }, { status: 429 })

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY nicht gesetzt' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const bodyHtml = typeof body.body_html === 'string' ? body.body_html : ''
  if (!subject || !bodyHtml) {
    return NextResponse.json({ error: 'subject und body_html erforderlich' }, { status: 400 })
  }
  const eventMode = body.event_mode === 'weihnachtlich' ? 'weihnachtlich' : null

  const admin = createSupabaseAdmin()
  let logoUrl: string | null = null
  try {
    const { data: logoRow } = await admin.from('site_settings').select('value').eq('key', 'logo_url').maybeSingle()
    if (logoRow?.value && typeof logoRow.value === 'string') logoUrl = logoRow.value.trim() || null
  } catch {
    // optional
  }

  const { data: subscribers, error: subErr } = await admin
    .from('newsletter_subscribers')
    .select('id, email')
    .eq('is_active', true)

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 })
  const list = (subscribers ?? []).filter((s) => s.email?.trim())
  if (list.length === 0) {
    return NextResponse.json({ error: 'Keine aktiven Abonnenten vorhanden.' }, { status: 400 })
  }

  const newsletterId = crypto.randomUUID()
  const { error: insertErr } = await admin.from('newsletters').insert({
    id: newsletterId,
    subject,
    body_html: bodyHtml,
    status: 'sending',
    recipient_count: list.length,
  })
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  const resend = new Resend(apiKey)
  const from = getResendFrom()
  let sent = 0
  let failed = 0

  for (let i = 0; i < list.length; i += BATCH_SIZE) {
    const batch = list.slice(i, i + BATCH_SIZE)
    const promises = batch.map((sub) => {
      const html = wrapNewsletterHtml(bodyHtml, sub.id, { logoUrl, eventMode })
      return resend.emails.send({
        from,
        to: sub.email!,
        subject,
        html,
      })
    })
    const results = await Promise.all(promises)
    for (const r of results) {
      if (r.error) failed++
      else sent++
    }
  }

  await admin
    .from('newsletters')
    .update({
      status: failed === list.length ? 'failed' : 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', newsletterId)

  return NextResponse.json({
    ok: true,
    newsletter_id: newsletterId,
    recipient_count: list.length,
    sent,
    failed,
  })
}
