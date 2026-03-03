import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/widget/config?apiKey=xxx
 * Öffentliche API für Buy-With-Widget: Liefert Konfiguration, wenn apiKey gültig und Origin/Referer auf domain_whitelist.
 */
export async function GET(request: NextRequest) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const apiKey = request.nextUrl.searchParams.get('apiKey')
  const origin = request.headers.get('origin') ?? ''
  const referer = request.headers.get('referer') ?? ''
  const host = referer ? new URL(referer).host : origin.replace(/^https?:\/\//, '').split('/')[0]

  if (!apiKey) {
    return NextResponse.json({ error: 'apiKey fehlt' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: row, error } = await admin
    .schema('external_commerce')
    .from('widget_deployments')
    .select('widget_id, vendor_id, domain_whitelist, status')
    .eq('public_api_key', apiKey)
    .eq('status', 'ACTIVE')
    .maybeSingle()

  if (error || !row) {
    return NextResponse.json({ error: 'Ungültiger API-Key' }, { status: 401 })
  }

  const allowedDomains = (row.domain_whitelist || '')
    .split(',')
    .map((d: string) => d.trim().toLowerCase())
    .filter(Boolean)
  const allowed = host && allowedDomains.some((d: string) => host === d || host.endsWith('.' + d))

  if (!allowed) {
    return NextResponse.json({ error: 'Domain nicht erlaubt' }, { status: 403 })
  }

  return NextResponse.json({
    widgetId: row.widget_id,
    vendorId: row.vendor_id,
    checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/checkout`,
  })
}
