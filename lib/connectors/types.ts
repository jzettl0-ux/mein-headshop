/**
 * Standardisierte Typen für das API-Connector-System.
 * Jede externe Schnittstelle (Partner, Influencer) mappt auf diese Strukturen.
 */

/** Normalisiertes Produkt aus einer externen API – wird in unsere DB transformiert */
export interface NormalizedProduct {
  external_id: string
  name: string
  description?: string | null
  price: number
  stock: number
  image_url?: string | null
  category?: string | null
  sku?: string | null
  raw?: Record<string, unknown>
}

/** Konfiguration einer Integration (aus DB: integrations) */
export interface ConnectorConfig {
  id: string
  name: string
  connector_type: string
  api_endpoint: string
  api_key: string | null
  sync_interval_minutes: number
  is_active: boolean
  supplier_id?: string | null
  last_sync_at?: string | null
  last_sync_status?: 'success' | 'error' | 'pending' | null
  last_sync_message?: string | null
}

/** Ergebnis eines Sync-Laufs */
export interface SyncResult {
  success: boolean
  message: string
  products_created?: number
  products_updated?: number
  products_skipped?: number
  error?: string
}

/** Basis-Interface für alle Connector-Implementierungen */
export interface IBaseConnector {
  readonly type: string
  /** Externe Daten abrufen und in NormalizedProduct[] transformieren */
  fetchAndNormalize(config: ConnectorConfig): Promise<NormalizedProduct[]>
  /** Vollständiger Sync: fetch + push + Status setzen (Implementierung nutzt createSupabaseAdmin) */
  sync(config: ConnectorConfig): Promise<SyncResult>
}
