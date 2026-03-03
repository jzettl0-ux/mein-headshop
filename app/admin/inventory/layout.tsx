import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { canAccessInventory } from '@/lib/admin-permissions'

export default async function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { roles, isAdmin } = await getAdminContext()
  if (!isAdmin) redirect('/auth?redirect=/admin')
  const effectiveRoles = roles?.length ? roles : []
  if (!canAccessInventory(effectiveRoles)) redirect('/admin/access-denied')
  return <>{children}</>
}
