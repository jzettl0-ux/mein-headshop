import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { getDhlAccessToken } from '@/lib/dhl-parcel'
import { getDhlCredentials } from '@/lib/shipping-settings'

export const dynamic = 'force-dynamic'

/**
 * GET – Admin: DHL-Verbindung testen.
 * Credentials aus Admin oder .env.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const creds = await getDhlCredentials()
  const hasKey = !!creds.api_key?.trim()
  const hasSecret = !!creds.api_secret?.trim()
  const hasGkp = !!(creds.gkp_username?.trim() || creds.sandbox)
  const hasGkpPw = !!creds.gkp_password?.trim()
  const hasBilling = !!(creds.billing_number?.trim() && creds.billing_number.length >= 14)
  const isSandbox = creds.sandbox

  if (!hasKey || !hasSecret || !hasGkp || !hasGkpPw) {
    return NextResponse.json({
      ok: false,
      message: 'DHL-Credentials unvollständig',
      config: {
        hasApiKey: hasKey,
        hasApiSecret: hasSecret,
        hasGkpUsername: hasGkp,
        hasGkpPassword: hasGkpPw,
        hasBillingNumber: hasBilling,
        sandbox: isSandbox,
      },
    }, { status: 200 })
  }

  try {
    const token = await getDhlAccessToken()
    return NextResponse.json({
      ok: true,
      message: 'DHL OAuth erfolgreich',
      config: {
        hasApiKey: true,
        hasApiSecret: true,
        hasGkpUsername: true,
        hasGkpPassword: true,
        hasBillingNumber: hasBilling,
        sandbox: isSandbox,
        tokenReceived: !!token,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
    return NextResponse.json({
      ok: false,
      message: msg,
      config: {
        hasApiKey: hasKey,
        hasApiSecret: hasSecret,
        hasGkpUsername: hasGkp,
        hasGkpPassword: hasGkpPw,
        hasBillingNumber: hasBilling,
        sandbox: isSandbox,
      },
    }, { status: 200 })
  }
}
