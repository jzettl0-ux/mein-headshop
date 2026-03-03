import type { SupabaseClient } from '@supabase/supabase-js'

/** GoBD: Alle relevanten Entitätstypen für revisionssichere Protokollierung. */
export type AuditEntity = 'product' | 'finance_settings' | 'order' | 'staff' | 'customer'
export type AuditAction = 'update' | 'create' | 'delete'

export interface AuditLogEntry {
  entity_type: AuditEntity
  entity_id?: string | null
  action: AuditAction
  field_name?: string | null
  old_value?: string | null
  new_value?: string | null
  changed_by_email?: string | null
  changed_by_id?: string | null
}

/**
 * Schreibt einen Eintrag in audit_logs. Tabelle muss existieren (migration-audit-logs.sql).
 * Aufruf nach Änderungen an Preisen, Steuersätzen, Beständen, Finanz-Parameter.
 */
export async function writeAuditLog(
  admin: SupabaseClient,
  entry: AuditLogEntry,
  actor?: { email?: string | null; id?: string | null }
): Promise<void> {
  try {
    await admin.from('audit_logs').insert({
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      action: entry.action,
      field_name: entry.field_name ?? null,
      old_value: entry.old_value ?? null,
      new_value: entry.new_value ?? null,
      changed_by_email: actor?.email ?? entry.changed_by_email ?? null,
      changed_by_id: actor?.id ?? entry.changed_by_id ?? null,
    })
  } catch (e) {
    console.warn('audit_log write failed:', e)
  }
}

/** Felder pro Entitätstyp, die bei Änderung geloggt werden (GoBD). */
const ENTITY_FIELDS: Partial<Record<AuditEntity, string[]>> = {
  product: ['price', 'cost_price', 'stock', 'min_stock_level', 'reference_price_30d', 'discount_percent', 'discount_until', 'is_active'],
  finance_settings: ['tax_rate', 'mollie_fixed', 'mollie_percent', 'revenue_limit'],
  order: ['status', 'payment_status', 'processing_status', 'assigned_to_email', 'tracking_number', 'tracking_carrier', 'return_request_status', 'cancellation_request_status'],
  staff: ['email', 'roles', 'is_active'],
  customer: ['customer_email', 'customer_name'],
}

/** Hilfsfunktion: Änderungen zwischen alt und neu für ein Objekt loggen (nur konfigurierte Felder). */
export async function logEntityChanges(
  admin: SupabaseClient,
  entity_type: AuditEntity,
  entity_id: string | undefined,
  oldRecord: Record<string, unknown>,
  newRecord: Record<string, unknown>,
  actor?: { email?: string | null; id?: string | null }
): Promise<void> {
  const fieldsToLog = ENTITY_FIELDS[entity_type] ?? ['price', 'cost_price', 'stock', 'min_stock_level', 'tax_rate', 'mollie_fixed', 'mollie_percent', 'revenue_limit']
  for (const field of fieldsToLog) {
    const oldVal = oldRecord[field]
    const newVal = newRecord[field]
    if (oldVal === newVal) continue
    const oldStr = oldVal != null ? String(oldVal) : null
    const newStr = newVal != null ? String(newVal) : null
    await writeAuditLog(admin, {
      entity_type,
      entity_id,
      action: 'update',
      field_name: field,
      old_value: oldStr,
      new_value: newStr,
    }, actor)
  }
}
