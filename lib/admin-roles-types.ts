/**
 * Typen für Admin-Bereiche und konfigurierbare Rollen.
 * Ermöglicht später: Teamleiter pro Bereich, Rollen anlegen/entfernen,
 * Zuordnung Rolle ↔ Bereich, Befugnisse, Unterstellung.
 */

export interface AdminArea {
  id: string
  slug: string
  name: string
  description: string | null
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface AdminRole {
  id: string
  slug: string
  name: string
  description: string | null
  area_id: string | null
  parent_role_id: string | null
  permissions: string[]
  is_system: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
  /** Aufgelöst: Bereich (falls area_id gesetzt) */
  area?: AdminArea | null
  /** Aufgelöst: übergeordnete Rolle (falls parent_role_id gesetzt) */
  parent_role?: AdminRole | null
}

/** Bekannte System-Rollen-Slugs (stimmen mit admin_roles.seed überein). Weitere Rollen können in der DB angelegt werden. */
export const SYSTEM_ROLE_SLUGS = [
  'owner',
  'chef',
  'admin',
  'product_care',
  'support',
  'employee',
  'hr',
  'team_leader',
  'warehouse_lead',
  'marketing',
] as const

export type SystemRoleSlug = (typeof SYSTEM_ROLE_SLUGS)[number]

/** Prüft, ob ein Slug eine gültige (bekannte oder in DB vorhandene) Rolle ist. */
export function isKnownRoleSlug(slug: string): slug is SystemRoleSlug {
  return SYSTEM_ROLE_SLUGS.includes(slug as SystemRoleSlug)
}
