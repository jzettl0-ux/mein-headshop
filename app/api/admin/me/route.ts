import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import type { StaffRole } from '@/lib/admin-auth'
import {
  canAccessOrders,
  canAccessProducts,
  canAccessFinances,
  canAccessSettingsOwnerOnly,
  canAccessInventory,
  canSeePurchasePrices,
  canManageStaff,
  canAccessMarketing,
} from '@/lib/admin-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET – Aktueller Admin-User + Rollen + Berechtigungen (RBAC).
 * roles = Array aus staff; Sidebar und UI nutzen permissions.
 */
export async function GET() {
  const { user, staff, roles, isAdmin, isOwner, isStaffManager } = await getAdminContext()
  if (!user || !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const effectiveRoles: StaffRole[] = roles?.length ? (roles as StaffRole[]) : (isOwner ? ['owner'] : [])
  return NextResponse.json({
    user: { id: user.id, email: user.email },
    staff: staff ? { id: staff.id, roles: staff.roles || [], email: staff.email } : null,
    roles: effectiveRoles,
    isOwner,
    isStaffManager,
    permissions: {
      canAccessOrders: canAccessOrders(effectiveRoles),
      canAccessProducts: canAccessProducts(effectiveRoles),
      canAccessFinances: canAccessFinances(effectiveRoles),
      canAccessSettings: canAccessSettingsOwnerOnly(effectiveRoles),
      canAccessInventory: canAccessInventory(effectiveRoles),
      canSeePurchasePrices: canSeePurchasePrices(effectiveRoles),
      canManageStaff: canManageStaff(effectiveRoles),
      canAccessMarketing: canAccessMarketing(effectiveRoles),
    },
  })
}
