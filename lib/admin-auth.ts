import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { OWNER_EMAIL } from '@/lib/owner-email'

export type StaffRole = 'owner' | 'chef' | 'admin' | 'product_care' | 'support' | 'employee' | 'hr' | 'team_leader' | 'warehouse_lead' | 'marketing'

const ADMIN_ROLES: StaffRole[] = ['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'hr', 'team_leader', 'warehouse_lead', 'marketing']
/** Inhaber, Chef und Personal (hr) dürfen Mitarbeiter einstellen und verwalten. Chef/hr dürfen das Inhaber-Konto nicht ändern/löschen; hr darf keine Rollen owner/chef vergeben. */
const STAFF_MANAGER_ROLES: StaffRole[] = ['owner', 'chef', 'hr']

export interface StaffRow {
  id: string
  email: string
  role?: StaffRole
  roles: StaffRole[]
  is_active: boolean
  user_id: string | null
  /** Vorgesetzte/r (z. B. Teamleiter). Optional. */
  reports_to_id?: string | null
  /** Teamleiter für diesen Bereich (nur eine Area pro Person). Optional. */
  lead_for_area_id?: string | null
}

/**
 * Prüft ob die aktuelle Session ein Admin ist (Owner-E-Mail oder aktiver Mitarbeiter).
 * Für API Routes: User aus Cookie-Session, Staff aus DB (Service Role).
 * isStaffManager = darf Mitarbeiter verwalten (Owner + Chef). Chef darf Inhaber-Konto nicht ändern/löschen.
 */
export async function getAdminContext(): Promise<{
  user: { id: string; email: string } | null
  staff: StaffRow | null
  roles: StaffRole[]
  isAdmin: boolean
  isOwner: boolean
  isStaffManager: boolean
}> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return { user: null, staff: null, roles: [], isAdmin: false, isOwner: false, isStaffManager: false }
  }

  const isOwnerEmail = user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()
  let staff: StaffRow | null = null

  if (hasSupabaseAdmin()) {
    try {
      const admin = createSupabaseAdmin()
      const { data: row } = await admin
        .from('staff')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle()
      if (row) {
        const r = row as Record<string, unknown>
        staff = {
          id: r.id as string,
          email: r.email as string,
          is_active: r.is_active as boolean,
          user_id: (r.user_id as string) || null,
          roles: Array.isArray(r.roles) ? (r.roles as StaffRole[]) : r.role ? [r.role as StaffRole] : ['support'],
          reports_to_id: (r.reports_to_id as string) || null,
          lead_for_area_id: (r.lead_for_area_id as string) || null,
        }
      }
    } catch {
      // Tabelle staff existiert evtl. noch nicht
    }
  }

  const roles: StaffRole[] = staff?.roles?.length ? staff.roles : (isOwnerEmail ? ['owner'] : [])
  const hasRole = (r: StaffRole) => roles.includes(r)
  const isAdmin = isOwnerEmail || (!!staff && roles.some((r) => ADMIN_ROLES.includes(r)))
  const isOwner = isOwnerEmail || hasRole('owner')
  const isStaffManager = isOwnerEmail || roles.some((r) => STAFF_MANAGER_ROLES.includes(r))

  return {
    user: user ? { id: user.id, email: user.email } : null,
    staff,
    roles,
    isAdmin,
    isOwner,
    isStaffManager,
  }
}

/**
 * Für API-Routes: Gibt { ok, error?, status } zurück.
 * Wenn ok=true, darf die Route fortfahren.
 */
export async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string; status: number }
> {
  const ctx = await getAdminContext()
  if (!ctx.user) {
    return { ok: false, error: 'Nicht angemeldet', status: 401 }
  }
  if (!ctx.isAdmin) {
    return { ok: false, error: 'Keine Admin-Berechtigung', status: 403 }
  }
  return { ok: true }
}

export { OWNER_EMAIL }
