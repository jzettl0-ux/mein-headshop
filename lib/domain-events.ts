/**
 * Phase 12: Domain Events – Event-Driven Foundation
 *
 * DB-Trigger (12.1) schreiben order_created und payment_received in events.domain_events.
 * Supabase Realtime (12.2) kann auf diese Tabelle subscriben.
 *
 * Realtime aktivieren: Supabase Dashboard → Database → Replication → events.domain_events aktivieren
 */

import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export type DomainEventType = 'order_created' | 'payment_received'

export interface DomainEvent {
  id: string
  event_type: DomainEventType
  aggregate_type: string
  aggregate_id: string | null
  payload: Record<string, unknown>
  created_at: string
}

/**
 * Liest die letzten Domain-Events (für Admin/Debug).
 */
export async function getRecentDomainEvents(
  limit = 50,
  eventType?: DomainEventType
): Promise<DomainEvent[]> {
  if (!hasSupabaseAdmin()) return []

  const admin = createSupabaseAdmin()
  let q = admin
    .schema('events')
    .from('domain_events')
    .select('id, event_type, aggregate_type, aggregate_id, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (eventType) {
    q = q.eq('event_type', eventType) as typeof q
  }

  const { data, error } = await q
  if (error) return []
  return (data ?? []) as DomainEvent[]
}

/**
 * Beispiel für Realtime-Subscription (Client-seitig mit @supabase/supabase-js):
 *
 * ```ts
 * import { createClient } from '@supabase/supabase-js'
 *
 * const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 *
 * const channel = supabase
 *   .channel('domain_events')
 *   .on(
 *     'postgres_changes',
 *     {
 *       event: 'INSERT',
 *       schema: 'public',  // oder schema: 'events' je nach Realtime-Konfiguration
 *       table: 'domain_events',
 *     },
 *     (payload) => {
 *       const event = payload.new as DomainEvent
 *       if (event.event_type === 'payment_received') {
 *         // z.B. Analytics, Benachrichtigung, etc.
 *       }
 *     }
 *   )
 *   .subscribe()
 * ```
 *
 * Hinweis: Supabase Realtime unterstützt schema 'events' wenn die Tabelle
 * events.domain_events in der Replication aktiviert ist.
 */
