import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { getDhlAccessToken } from '@/lib/dhl-parcel'
import { getCarrierLinks } from '@/lib/shipping-settings'

export const dynamic = 'force-dynamic'

const CARRIERS = ['dhl', 'dpd', 'gls', 'hermes', 'ups'] as const

/**
 * GET – Carrier-Verbindung testen.
 * Query: ?carrier=dhl|dpd|gls|hermes|ups
 * DHL: OAuth/API-Test. Andere: Portal-URL Erreichbarkeit (HEAD).
 */
export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const carrier = req.nextUrl.searchParams.get('carrier')?.toLowerCase().trim()
  if (!carrier || !CARRIERS.includes(carrier as (typeof CARRIERS)[number])) {
    return NextResponse.json({ error: 'Ungültiger Carrier. Erlaubt: dhl, dpd, gls, hermes, ups' }, { status: 400 })
  }

  if (carrier === 'dhl') {
    try {
      const token = await getDhlAccessToken()
      return NextResponse.json({
        ok: true,
        carrier: 'dhl',
        message: 'DHL API-Verbindung OK (OAuth erfolgreich)',
        details: { tokenReceived: !!token },
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
      return NextResponse.json({
        ok: false,
        carrier: 'dhl',
        message: msg,
      }, { status: 200 })
    }
  }

  // DPD, GLS, Hermes, UPS: Portal/Retouren-URL Erreichbarkeit prüfen
  const links = await getCarrierLinks()
  const cfg = links[carrier]
  const url = cfg?.portal?.trim() || cfg?.returns?.trim()
  const defaults: Record<string, string> = {
    dpd: 'https://www.dpd.de/de',
    gls: 'https://gls-group.eu/DE/de/geschaeftskunden',
    hermes: 'https://www.hermesworld.com/de',
    ups: 'https://www.ups.com/de/de/Home.page',
  }
  const testUrl = url || defaults[carrier]

  if (!testUrl) {
    return NextResponse.json({
      ok: false,
      carrier,
      message: 'Keine Portal-URL konfiguriert. Bitte in Carrier-Links eintragen.',
    }, { status: 200 })
  }

  try {
    const res = await fetch(testUrl, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) })
    const ok = res.ok || res.status === 405 || res.status === 403
    return NextResponse.json({
      ok,
      carrier,
      message: ok
        ? `${carrier.toUpperCase()} Portal erreichbar (${res.status})`
        : `Portal antwortet mit ${res.status}`,
      details: { status: res.status, url: testUrl },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Netzwerkfehler'
    return NextResponse.json({
      ok: false,
      carrier,
      message: `Portal nicht erreichbar: ${msg}`,
    }, { status: 200 })
  }
}
