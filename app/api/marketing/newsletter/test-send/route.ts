import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'
import { wrapNewsletterHtml } from '@/lib/newsletter-email-template'

export const dynamic = 'force-dynamic'

const TEST_SUBJECT_PREFIX = '[TEST] '

/**
 * POST – Test-E-Mail mit aktuellem Entwurf (HTML + Betreff) an test_email_address senden.
 * Rendering identisch zum finalen Versand (Logo, Event-Modus). Betreff wird mit "[TEST] " versehen.
 */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY ist nicht gesetzt. Resend reagiert nicht.' },
      { status: 503 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const bodyHtml = typeof body.body_html === 'string' ? body.body_html : ''
  if (!subject || !bodyHtml) {
    return NextResponse.json(
      { error: 'subject und body_html erforderlich' },
      { status: 400 }
    )
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

  const { data: testRow } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'newsletter_test_email')
    .maybeSingle()

  const testEmail = testRow?.value && typeof testRow.value === 'string' ? testRow.value.trim() : null
  if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
    return NextResponse.json(
      {
        error:
          'Keine gültige Test-E-Mail-Adresse hinterlegt. Bitte unter Einstellungen oder in site_settings (key: newsletter_test_email) eintragen.',
      },
      { status: 400 }
    )
  }

  const html = wrapNewsletterHtml(bodyHtml, undefined, { logoUrl, eventMode })
  const resend = new Resend(apiKey)
  const from = getResendFrom()

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: testEmail,
      subject: TEST_SUBJECT_PREFIX + subject,
      html,
    })

    if (error) {
      console.error('Newsletter test-send Resend error:', error)
      return NextResponse.json(
        { error: error.message || 'Resend konnte die E-Mail nicht senden.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: `Test-E-Mail an ${testEmail} gesendet.`,
      id: data?.id,
    })
  } catch (e) {
    console.error('Newsletter test-send error:', e)
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : 'Resend hat nicht reagiert. API-Key und Netzwerk prüfen.',
      },
      { status: 500 }
    )
  }
}
