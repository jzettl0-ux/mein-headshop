import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import type { ConnectorConfig, NormalizedProduct, SyncResult } from './types'

/**
 * Abstrakte Basisklasse für alle API-Connector-Implementierungen.
 * Standardisiert: Produktdaten-Abgleich, optional Lagerbestand- und Preis-Updates.
 */
export abstract class BaseConnector {
  abstract readonly type: string

  /** Externe API aufrufen und in NormalizedProduct[] transformieren */
  abstract fetchAndNormalize(config: ConnectorConfig): Promise<NormalizedProduct[]>

  /** Slug aus Namen erzeugen (für products.slug) */
  protected slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'produkt'
  }

  /** Normalisierte Produkte in Supabase products schreiben (Upsert anhand integration_id + external_id) */
  protected async pushToDatabase(
    integrationId: string,
    supplierId: string | null,
    products: NormalizedProduct[]
  ): Promise<{ created: number; updated: number; skipped: number; error?: string }> {
    if (!hasSupabaseAdmin()) return { created: 0, updated: 0, skipped: 0, error: 'Supabase Admin nicht verfügbar' }
    const admin = createSupabaseAdmin()

    let created = 0
    let updated = 0
    const category = 'zubehoer' // Default; Connector kann überschreiben

    for (const p of products) {
      const baseSlug = this.slugify(p.name)
      const payload = {
        name: p.name,
        slug: `${baseSlug}-${integrationId.slice(0, 8)}-${p.external_id.slice(0, 12).replace(/[^a-z0-9-]/gi, '')}`,
        description: p.description ?? null,
        price: p.price,
        stock: p.stock,
        image_url: p.image_url ?? null,
        category: (p.category as 'bongs' | 'grinder' | 'papers' | 'vaporizer' | 'zubehoer' | 'influencer-drops') ?? category,
        external_id: p.external_id,
        integration_id: integrationId,
        supplier_id: supplierId,
        updated_at: new Date().toISOString(),
      }

      const { data: existing } = await admin
        .from('products')
        .select('id')
        .eq('integration_id', integrationId)
        .eq('external_id', p.external_id)
        .maybeSingle()

      if (existing) {
        // Bei bestehendem Produkt nur Preis und Lagerbestand aktualisieren
        const { error } = await admin
          .from('products')
          .update({
            price: p.price,
            stock: p.stock,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        if (error) return { created, updated, skipped: products.length - created - updated - 1, error: error.message }
        updated++
      } else {
        const { error } = await admin.from('products').insert({ ...payload, created_at: new Date().toISOString() })
        if (error) return { created, updated, skipped: products.length - created - updated - 1, error: error.message }
        created++
      }
    }

    return { created, updated, skipped: Math.max(0, products.length - created - updated) }
  }

  /** Vollständiger Sync: fetch → push → Status in integrations speichern */
  async sync(config: ConnectorConfig): Promise<SyncResult> {
    if (!hasSupabaseAdmin()) return { success: false, message: 'Supabase Admin nicht verfügbar' }

    const admin = createSupabaseAdmin()
    const integrationId = config.id
    const supplierId = config.supplier_id ?? null

    try {
      const products = await this.fetchAndNormalize(config)
      const { created, updated, skipped, error } = await this.pushToDatabase(integrationId, supplierId, products)

      if (error) {
        await admin
          .from('integrations')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'error',
            last_sync_message: error,
            updated_at: new Date().toISOString(),
          })
          .eq('id', integrationId)
        return { success: false, message: error, products_created: created, products_updated: updated, products_skipped: skipped }
      }

      await admin
        .from('integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'success',
          last_sync_message: `OK: ${created} neu, ${updated} aktualisiert`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId)

      return {
        success: true,
        message: `Sync erfolgreich: ${created} neu, ${updated} aktualisiert`,
        products_created: created,
        products_updated: updated,
        products_skipped: skipped,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await admin
        .from('integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'error',
          last_sync_message: msg.slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId)
      return { success: false, message: msg, error: msg }
    }
  }
}
