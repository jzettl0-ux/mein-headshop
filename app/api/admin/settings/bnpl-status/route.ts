import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/settings/bnpl-status
 * Zeigt nur, ob Mondu/Billie API-Keys gesetzt sind (für Admin-Anzeige).
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const mondu_configured = !!(process.env.MONDU_API_KEY?.trim())
  const billie_configured = !!(process.env.BILLIE_API_KEY?.trim())

  return NextResponse.json({ mondu_configured, billie_configured })
}
