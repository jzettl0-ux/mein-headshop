import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const MOLLIE_TOKEN_URL = 'https://api.mollie.com/oauth2/tokens'
const MOLLIE_ORGANIZATIONS_ME = 'https://api.mollie.com/v2/organizations/me'

/**
 * GET – Callback nach Mollie OAuth: Code gegen Token tauschen, Organization abrufen, Vendor aktualisieren.
 * Redirect zurück zur Vendor-Admin-Seite mit ?mollie_connect=ok oder ?mollie_connect=error.
 */
export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) {
    const url = new URL(req.nextUrl.origin + '/admin/vendors')
    url.searchParams.set('mollie_connect', 'error')
    url.searchParams.set('reason', 'unauthorized')
    return NextResponse.redirect(url)
  }
  if (!hasSupabaseAdmin()) {
    const url = new URL(req.nextUrl.origin + '/admin/vendors')
    url.searchParams.set('mollie_connect', 'error')
    url.searchParams.set('reason', 'service')
    return NextResponse.redirect(url)
  }

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state') // vendor_id
  const errorParam = req.nextUrl.searchParams.get('error')

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : req.nextUrl.origin)
  const redirectUri = `${baseUrl}/api/admin/mollie-connect/callback`
  const vendorEditUrl = state ? `${baseUrl}/admin/vendors/${state}` : `${baseUrl}/admin/vendors`

  if (errorParam) {
    const desc = req.nextUrl.searchParams.get('error_description') || errorParam
    return NextResponse.redirect(
      `${vendorEditUrl}?mollie_connect=error&reason=${encodeURIComponent(desc)}`
    )
  }

  if (!code?.trim() || !state?.trim()) {
    return NextResponse.redirect(
      `${vendorEditUrl}?mollie_connect=error&reason=missing_code_or_state`
    )
  }

  const clientId = process.env.MOLLIE_CONNECT_CLIENT_ID
  const clientSecret = process.env.MOLLIE_CONNECT_CLIENT_SECRET
  if (!clientId?.trim() || !clientSecret?.trim()) {
    return NextResponse.redirect(
      `${vendorEditUrl}?mollie_connect=error&reason=connect_not_configured`
    )
  }

  // Code gegen Access Token tauschen
  const tokenRes = await fetch(MOLLIE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code.trim(),
      redirect_uri: redirectUri,
    }).toString(),
  })

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text()
    console.error('Mollie token exchange failed:', tokenRes.status, errBody)
    return NextResponse.redirect(
      `${vendorEditUrl}?mollie_connect=error&reason=token_exchange_failed`
    )
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string }
  const accessToken = tokenData.access_token
  if (!accessToken) {
    return NextResponse.redirect(
      `${vendorEditUrl}?mollie_connect=error&reason=no_access_token`
    )
  }

  // Aktuelle Organization abrufen (der angemeldete Vendor)
  const orgRes = await fetch(MOLLIE_ORGANIZATIONS_ME, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!orgRes.ok) {
    console.error('Mollie organizations/me failed:', orgRes.status, await orgRes.text())
    return NextResponse.redirect(
      `${vendorEditUrl}?mollie_connect=error&reason=org_fetch_failed`
    )
  }

  const orgData = (await orgRes.json()) as { id?: string }
  const organizationId = orgData.id
  if (!organizationId || !organizationId.startsWith('org_')) {
    return NextResponse.redirect(
      `${vendorEditUrl}?mollie_connect=error&reason=invalid_org_id`
    )
  }

  const admin = createSupabaseAdmin()
  const { error: updateError } = await admin
    .from('vendor_accounts')
    .update({ mollie_organization_id: organizationId })
    .eq('id', state)

  if (updateError) {
    console.error('Vendor mollie_organization_id update failed:', updateError)
    return NextResponse.redirect(
      `${vendorEditUrl}?mollie_connect=error&reason=db_update_failed`
    )
  }

  return NextResponse.redirect(`${vendorEditUrl}?mollie_connect=ok`)
}
