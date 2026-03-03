import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendNewsletterDiscountCodeEmail } from '@/lib/send-order-email'

/**
 * GET /api/cron/send-newsletter-discount-codes?secret=CRON_SECRET
 * Sendet den Willkommens-Rabattcode 1 Tag nach Newsletter-Anmeldung.
 * Soll täglich ausgeführt werden (z. B. Vercel Cron).
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = process.env.CRON_SECRET
  if (secret && searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()

  const { data: setting } = await admin.from('site_settings').select('value').eq('key', 'newsletter_discount_code').maybeSingle()
  const discountCode = setting?.value?.trim()
  if (!discountCode) {
    return NextResponse.json({ sent: 0, skipped: 'kein Rabattcode konfiguriert' })
  }

  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const { data: subs, error } = await admin
    .from('newsletter_subscribers')
    .select('id, email, subscribed_at')
    .eq('is_active', true)
    .is('discount_code_sent_at', null)
    .lte('subscribed_at', oneDayAgo.toISOString())

  if (error || !subs?.length) {
    return NextResponse.json({ sent: 0, errors: error ? [error.message] : [] })
  }

  let sent = 0
  const errors: string[] = []

  for (const sub of subs) {
    const result = await sendNewsletterDiscountCodeEmail(sub.email, discountCode)
    if (result.ok) {
      await admin
        .from('newsletter_subscribers')
        .update({ discount_code_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', sub.id)
      sent++
    } else {
      errors.push(`${sub.email}: ${result.error}`)
    }
  }

  return NextResponse.json({ sent, total: subs.length, errors: errors.length ? errors : undefined })
}
