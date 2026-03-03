// Das "Gesetzbuch" für jeden Connector
export interface ProductData {
  externalId: string;
  name: string;
  price: number;
  stock: number;
  image_url?: string;
}

/** Bestelldaten für Dropshipping-API-Übermittlung */
export interface SupplierOrderPayload {
  order_number: string;
  customer_name: string;
  shipping_address: { street?: string; house_number?: string; postal_code?: string; city?: string; country?: string };
  items: Array<{ product_name: string; quantity: number; price?: number; external_id?: string }>;
}

export interface SupplierApiConfig {
  api_endpoint: string;
  api_key?: string | null;
  api_headers?: Record<string, string> | null;
}

export abstract class BaseConnector {
  abstract fetchProducts(): Promise<ProductData[]>;

  /**
   * Bestellung an Lieferanten-API senden (z. B. MockInfluencerConnector).
   * Optional überschreiben; Standard: keine Aktion.
   */
  async submitOrder?(_config: SupplierApiConfig, _order: SupplierOrderPayload): Promise<{ ok: boolean; error?: string }> {
    return { ok: false, error: 'submitOrder nicht implementiert' }
  }
}