import { BaseConnector } from './BaseConnector'
import type { ConnectorConfig, NormalizedProduct } from './types'

/**
 * Beispiel-Connector: Liest von einer externen JSON-Schnittstelle (z. B. Partner/Influencer-API).
 * Erwartet ein Array von Objekten mit: id, name, description?, price, stock, image_url?, category?
 * Header "Authorization: Bearer <api_key>" wenn api_key gesetzt.
 */
export class InfluencerAPIConnector extends BaseConnector {
  readonly type = 'influencer_api'

  async fetchAndNormalize(config: ConnectorConfig): Promise<NormalizedProduct[]> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (config.api_key) {
      headers['Authorization'] = `Bearer ${config.api_key}`
    }

    const res = await fetch(config.api_endpoint, { headers, next: { revalidate: 0 } })
    if (!res.ok) {
      throw new Error(`API ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    const items = Array.isArray(data) ? data : data?.products ?? data?.items ?? []
    if (!Array.isArray(items)) {
      throw new Error('API lieferte kein Array von Produkten')
    }

    return items.map((item: Record<string, unknown>, index: number): NormalizedProduct => {
      const id = typeof item.id === 'string' ? item.id : typeof item.id === 'number' ? String(item.id) : `item-${index}`
      const name = typeof item.name === 'string' ? item.name : String(item.name ?? 'Unbekannt')
      const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price ?? 0)) || 0
      const stock = typeof item.stock === 'number' ? item.stock : parseInt(String(item.stock ?? 0), 10) || 0
      return {
        external_id: id,
        name,
        description: typeof item.description === 'string' ? item.description : null,
        price,
        stock,
        image_url: typeof item.image_url === 'string' ? item.image_url : typeof item.image === 'string' ? item.image : null,
        category: typeof item.category === 'string' ? item.category : null,
        sku: typeof item.sku === 'string' ? item.sku : null,
        raw: item as Record<string, unknown>,
      }
    })
  }
}
