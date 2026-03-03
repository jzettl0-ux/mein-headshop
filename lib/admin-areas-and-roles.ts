/**
 * Server-seitiges Laden der Admin-Bereiche und Rollen aus der DB.
 * Für spätere Admin-UI: Rollen/Bereiche verwalten, Teamleiter zuweisen.
 * Nutzt createSupabaseAdmin() – nur in API/Server-Kontext verwenden.
 */

import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import type { AdminArea, AdminRole } from '@/lib/admin-roles-types'

export type { AdminArea, AdminRole }

/** Lädt alle Admin-Bereiche, sortiert nach sort_order. */
export async function getAdminAreas(): Promise<AdminArea[]> {
  if (!hasSupabaseAdmin()) return []
  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .from('admin_areas')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error || !data) return []
    return (data as AdminArea[]) ?? []
  } catch {
    return []
  }
}

/** Lädt alle Rollen inkl. Bereich und übergeordneter Rolle (flach). */
export async function getAdminRoles(): Promise<AdminRole[]> {
  if (!hasSupabaseAdmin()) return []
  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .from('admin_roles')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error || !data) return []
    const roles = data as AdminRole[]
    const areas = await getAdminAreas()
    const areaById = new Map(areas.map((a) => [a.id, a]))
    const roleById = new Map(roles.map((r) => [r.id, r]))
    return roles.map((r) => ({
      ...r,
      area: r.area_id ? areaById.get(r.area_id) ?? null : null,
      parent_role: r.parent_role_id ? roleById.get(r.parent_role_id) ?? null : null,
    }))
  } catch {
    return []
  }
}

/** Lädt eine Rolle anhand des Slugs. */
export async function getAdminRoleBySlug(slug: string): Promise<AdminRole | null> {
  const roles = await getAdminRoles()
  return roles.find((r) => r.slug === slug) ?? null
}
