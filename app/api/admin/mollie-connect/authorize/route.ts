import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const MOLLIE_AUTHORIZE_URL = 'https://my.mollie.com/oauth2/authorize'

/**
 * GET – Startet Mollie Connect OAuth-Flow für einen Vendor.
 * Redirect zur Mollie-Authorize-URL; state = vendor_id.
 * Erfordert: MOLLIE_CONNECT_CLIENT_ID, MOLLIE_CONNECT_CLIENT_SECRET (OAuth-App bei Mollie).
 */
export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const clientId = process.env.MOLLIE_CONNECT_CLIENT_ID
  if (!clientId?.trim()) {
    return NextResponse.json(
      { error: 'Mollie Connect nicht konfiguriert. MOLLIE_CONNECT_CLIENT_ID fehlt.' },
      { status: 503 }
    )
  }

  const vendorId = req.nextUrl.searchParams.get('vendor_id')
  if (!vendorId?.trim()) {
    return NextResponse.json({ error: 'vendor_id fehlt' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: vendor, error } = await admin
    .from('vendor_accounts')
    .select('id')
    .eq('id', vendorId)
    .single()

  if (error || !vendor) {
    return NextResponse.json({ error: 'Vendor nicht gefunden' }, { status: 404 })
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : req.headers.get('x-forwarded-host')
        ? `https://${req.headers.get('x-forwarded-host')}`
        : req.nextUrl.origin
  const redirectUri = `${baseUrl}/api/admin/mollie-connect/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'organizations.read',
    state: vendorId,
  })

  const authorizeUrl = `${MOLLIE_AUTHORIZE_URL}?${params.toString()}`
  return NextResponse.redirect(authorizeUrl)
}
