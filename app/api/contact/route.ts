import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { isRecaptchaConfigured, verifyRecaptcha } from '@/lib/recaptcha'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function getClientId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'
  return `contact:${ip}`
}

/**
 * POST – Kontaktformular: Kundenanfrage speichern (ohne Auth).
 * Wenn reCAPTCHA konfiguriert ist, wird der Token verifiziert.
 */
export async function POST(req: NextRequest) {
  try {
    const { allowed } = checkRateLimit(getClientId(req), 5, 900)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte in 15 Minuten erneut versuchen.' },
        { status: 429 }
      )
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Kontakt derzeit nicht verfügbar.' }, { status: 503 })
    }

    const body = await req.json().catch(() => ({}))
    if (body.website_url != null && String(body.website_url).trim() !== '') {
      return NextResponse.json({ success: true })
    }
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const orderNumber = typeof body.order_number === 'string' ? body.order_number.trim() || null : null
    const captchaToken = typeof body.captcha_token === 'string' ? body.captcha_token.trim() : ''

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Bitte Name, E-Mail und Nachricht angeben.' },
        { status: 400 }
      )
    }

    if (isRecaptchaConfigured()) {
      const verify = await verifyRecaptcha(captchaToken)
      if (!verify.success) {
        return NextResponse.json(
          { error: verify.error || 'Bitte bestätige, dass du kein Roboter bist (reCAPTCHA).' },
          { status: 400 }
        )
      }
    }

    let admin
    try {
      admin = createSupabaseAdmin()
    } catch (e) {
      console.error('[Contact] Supabase Admin init:', e)
      return NextResponse.json({ error: 'Kontakt derzeit nicht verfügbar.' }, { status: 503 })
    }

    let orderId: string | null = null
    if (orderNumber) {
      const { data: order } = await admin
        .from('orders')
        .select('id')
        .eq('order_number', orderNumber)
        .maybeSingle()
      if (order) orderId = order.id
    }

    const { error } = await admin.from('customer_inquiries').insert({
      name,
      email,
      subject: subject || 'Anfrage über Kontaktformular',
      message,
      ...(orderNumber != null && { order_number: orderNumber }),
      ...(orderId != null && { order_id: orderId }),
      status: 'open',
    })

    if (error) {
      const errMsg = String(error.message || '')
      const errCode = (error as { code?: string | number }).code
      const codeStr = errCode != null ? String(errCode) : ''
      console.error('[Contact] Insert error:', JSON.stringify({ code: codeStr, message: errMsg }))
      if (codeStr === '42P01' || errMsg.includes('does not exist') || errMsg.includes('existiert nicht') || errMsg.includes('relation') && errMsg.includes('customer_inquiries')) {
        return NextResponse.json(
          { error: 'Tabelle für Anfragen fehlt. Im Supabase Dashboard → SQL Editor die Datei "migration-customer-inquiries.sql" ausführen (nach migration-staff.sql).' },
          { status: 503 }
        )
      }
      if (codeStr === '42501' || errMsg.includes('permission') || errMsg.includes('Policy') || errMsg.includes('RLS')) {
        return NextResponse.json(
          { error: 'Keine Berechtigung. SUPABASE_SERVICE_ROLE_KEY in .env.local setzen und Migrationen ausführen.' },
          { status: 503 }
        )
      }
      if (errMsg.includes('Invalid API key')) {
        return NextResponse.json(
          { error: 'Ungültiger API-Key. In .env.local SUPABASE_SERVICE_ROLE_KEY setzen – unter Supabase → Project Settings → API den Key „service_role“ (nicht anon) kopieren. Danach Server neu starten.' },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: 'Anfrage konnte nicht gespeichert werden.', detail: errMsg },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[Contact] Error:', e)
    if (msg.includes('Invalid API key')) {
      return NextResponse.json(
        { error: 'Ungültiger API-Key. In .env.local SUPABASE_SERVICE_ROLE_KEY setzen (Supabase → Project Settings → API → service_role). Server neu starten.' },
        { status: 503 }
      )
    }
    if (msg.includes('does not exist') || msg.includes('customer_inquiries') || msg.includes('relation')) {
      return NextResponse.json(
        { error: 'Tabelle für Anfragen fehlt. Bitte migration-customer-inquiries.sql im Supabase SQL Editor ausführen.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.', detail: msg }, { status: 500 })
  }
}
