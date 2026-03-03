import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { getDhlCredentials } from '@/lib/shipping-settings'

export const dynamic = 'force-dynamic'

/**
 * GET – Admin: Status aller externen Verbindungen (DHL, Mollie etc.).
 * DHL-Credentials aus Admin oder ENV.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const mollieConfigured = !!process.env.MOLLIE_API_KEY?.trim()
  const mollieWebhookUrl = process.env.MOLLIE_WEBHOOK_URL?.trim() || null

  const creds = await getDhlCredentials()
  const dhlApiKey = !!creds.api_key?.trim()
  const dhlApiSecret = !!creds.api_secret?.trim()
  const dhlGkp = !!(creds.gkp_username?.trim() || creds.sandbox)
  const dhlBilling = !!(creds.billing_number?.trim() && creds.billing_number.length >= 14)
  const dhlSandbox = creds.sandbox
  const dhlFullyConfigured = dhlApiKey && dhlApiSecret && dhlGkp && !!creds.gkp_password?.trim()

  return NextResponse.json({
    mollie: {
      configured: mollieConfigured,
      webhookUrlSet: !!mollieWebhookUrl,
    },
    dhl: {
      configured: dhlFullyConfigured,
      hasApiKey: dhlApiKey,
      hasApiSecret: dhlApiSecret,
      hasGkp: dhlGkp,
      hasBillingNumber: dhlBilling,
      sandbox: dhlSandbox,
    },
  })
}
