'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export type AdminPermissionKey = 'canAccessFinances' | 'canAccessSettings' | 'canAccessInventory' | 'canSeePurchasePrices'

interface MeResponse {
  permissions?: Record<AdminPermissionKey, boolean>
  roles?: string[]
  isOwner?: boolean
}

/**
 * Client-seitiger Hook: Prüft eine Berechtigung gegen /api/admin/me.
 * Wenn allowed === false nach dem Laden, Redirect zu /admin/access-denied.
 * Für serverseitigen Schutz werden Layouts (finances, settings, inventory) genutzt.
 */
export function useRequirePermission(permission: AdminPermissionKey): { allowed: boolean; loading: boolean } {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MeResponse | null) => {
        if (cancelled) return
        const value = data?.permissions?.[permission] ?? false
        setAllowed(value)
        if (!value) router.replace('/admin/access-denied')
      })
      .catch(() => {
        if (!cancelled) router.replace('/admin/access-denied')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [permission, router])

  return { allowed, loading }
}
