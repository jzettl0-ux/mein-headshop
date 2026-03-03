'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Einheitlicher Auth-Einstieg: /login leitet auf /auth um.
 * Redirect-Parameter wird übernommen (z. B. /admin → /auth?redirect=/admin).
 */
export default function LoginRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const redirect = searchParams.get('redirect') || '/admin'
    router.replace(`/auth?redirect=${encodeURIComponent(redirect)}`)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-luxe-black flex items-center justify-center p-4">
      <p className="text-luxe-silver">Weiterleitung zur Anmeldung...</p>
    </div>
  )
}
