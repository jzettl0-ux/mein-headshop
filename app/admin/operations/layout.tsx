import { getAdminContext } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export default async function AdminOperationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) redirect('/auth?redirect=/admin/operations')

  return <>{children}</>
}
