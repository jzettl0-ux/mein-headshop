import { BaseConnector, ProductData, SupplierApiConfig, SupplierOrderPayload } from './base'

export class MockInfluencerConnector extends BaseConnector {
  async fetchProducts(): Promise<ProductData[]> {
    console.log('Rufe Daten vom Influencer-Server ab...')
    return [
      {
        externalId: 'INF-001',
        name: 'Influencer Signature Bong',
        price: 89.99,
        stock: 50,
        image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a',
      },
      {
        externalId: 'INF-002',
        name: 'Limited Gold Grinder',
        price: 34.5,
        stock: 12,
        image_url: 'https://images.unsplash.com/photo-1589133917562-b9e83e669041',
      },
    ]
  }

  override async submitOrder(
    config: SupplierApiConfig,
    order: SupplierOrderPayload
  ): Promise<{ ok: boolean; error?: string }> {
    const url = config.api_endpoint?.trim()
    if (!url) {
      console.log('[MockInfluencer] Kein api_endpoint – Bestellung nur geloggt:', order.order_number)
      return { ok: true }
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (config.api_key?.trim()) headers['Authorization'] = `Bearer ${config.api_key.trim()}`
    if (config.api_headers && typeof config.api_headers === 'object') {
      for (const [k, v] of Object.entries(config.api_headers)) {
        if (k && v != null) headers[k] = String(v)
      }
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(order),
      })
      if (!res.ok) {
        const text = await res.text()
        return { ok: false, error: `API ${res.status}: ${text.slice(0, 200)}` }
      }
      return { ok: true }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { ok: false, error: msg }
    }
  }
}