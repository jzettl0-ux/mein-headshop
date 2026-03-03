/**
 * Product Guidance: Search Gaps – Aktualisiert active_offers_count für alle Such-Lücken
 * Blueprint 3.5
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface SearchGapsRefreshResult {
  refreshed: number
  errors: string[]
}

/** Aktualisiert active_offers_count für alle Search Term Gaps */
export async function refreshAllSearchGaps(
  admin?: SupabaseClient
): Promise<SearchGapsRefreshResult> {
  const { createSupabaseAdmin, hasSupabaseAdmin } = await import('@/lib/supabase-admin')
  const client = admin ?? (hasSupabaseAdmin() ? createSupabaseAdmin() : null)
  if (!client) return { refreshed: 0, errors: ['Service nicht verfügbar'] }

  const result: SearchGapsRefreshResult = { refreshed: 0, errors: [] }

  const { data: gaps, error: fetchErr } = await client
    .schema('analytics')
    .from('search_term_gaps')
    .select('gap_id, search_term')

  if (fetchErr) {
    result.errors.push(fetchErr.message)
    return result
  }
  if (!gaps?.length) return result

  const now = new Date().toISOString()

  for (const g of gaps as { gap_id: string; search_term: string }[]) {
    try {
      const raw = g.search_term?.trim() ?? ''
      if (!raw) continue
      // Escape LIKE wildcards für sichere Suche
      const term = raw.replace(/%/g, '\\%').replace(/_/g, '\\_')

      const { count } = await client
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .or(`name.ilike.%${term}%,description.ilike.%${term}%`)

      const activeOffers = count ?? 0

      const { error: updateErr } = await client
        .schema('analytics')
        .from('search_term_gaps')
        .update({
          active_offers_count: activeOffers,
          last_analyzed_at: now,
        })
        .eq('gap_id', g.gap_id)

      if (updateErr) {
        result.errors.push(`${term}: ${updateErr.message}`)
      } else {
        result.refreshed++
      }
    } catch (e) {
      result.errors.push(`${g.search_term}: ${(e as Error).message}`)
    }
  }

  return result
}
