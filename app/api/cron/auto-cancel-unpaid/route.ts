import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/cron/auto-cancel-unpaid?secret=DEIN_CRON_SECRET
 * Storniert Bestellungen, die nach X Stunden noch nicht bezahlt sind.
 * X = site_settings.unpaid_cancel_hours (Default 48). 0 = deaktiviert.
 * Aufruf z. B. per Vercel Cron (stündlich) oder externem Cron.
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

  const { data: setting } = await admin.from('site_settings').select('value').eq('key', 'unpaid_cancel_hours').maybeSingle()
  let hours = 48
  if (setting?.value != null) {
    const n = parseInt(String(setting.value), 10)
    if (!Number.isNaN(n) && n >= 0) hours = n
  }
  if (hours === 0) {
    return NextResponse.json({ message: 'Auto-Stornierung deaktiviert (0 Stunden)', cancelled: 0 })
  }

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const { data: orders, error: fetchError } = await admin
    .from('orders')
    .select('id, order_number')
    .neq('status', 'cancelled')
    .or('payment_status.is.null,payment_status.neq.paid')
    .lt('created_at', cutoff)

  if (fetchError || !orders?.length) {
    return NextResponse.json({ cancelled: 0, cutoff, hours })
  }

  const ids = orders.map((o) => o.id)
  const { error: updateError } = await admin.from('orders').update({ status: 'cancelled' }).in('id', ids)

  if (updateError) {
    return NextResponse.json({ error: updateError.message, cancelled: 0 }, { status: 500 })
  }

  return NextResponse.json({ cancelled: ids.length, order_numbers: orders.map((o) => o.order_number), cutoff, hours })
}
