/**
 * DHL Shipment Tracking – Unified API (https://developer.dhl.com/api-reference/shipment-tracking)
 * Setze DHL_API_KEY in .env.local (Consumer Key aus dem DHL Developer Portal).
 * Ohne API-Key gibt die Funktion immer "unknown" zurück (keine automatische Zustellungserkennung).
 */
export type TrackingStatus = 'delivered' | 'in_transit' | 'unknown'

export async function getDhlTrackingStatus(trackingNumber: string): Promise<TrackingStatus> {
  const key = process.env.DHL_API_KEY?.trim()
  if (!key) return 'unknown'

  const num = trackingNumber.trim()
  if (!num) return 'unknown'

  try {
    const url = `https://api-eu.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(num)}`
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'DHL-API-Key': key,
      },
    })

    if (!res.ok) {
      if (res.status === 404) return 'unknown'
      console.error('DHL tracking API error', res.status, await res.text())
      return 'unknown'
    }

    const data = (await res.json()) as {
      shipments?: Array<{
        status?: { statusCode?: string; description?: string }
      }>
    }

    const shipment = data?.shipments?.[0]
    const code = shipment?.status?.statusCode?.toLowerCase()

    if (code === 'delivered' || code === 'zugestellt') return 'delivered'
    if (code) return 'in_transit'
    return 'unknown'
  } catch (e) {
    console.error('DHL tracking fetch error', e)
    return 'unknown'
  }
}
