'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/** Weiterleitung auf /auth/set-password mit gleichen Query-Parametern (z. B. token). */
export default function LoginSetPasswordRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  useEffect(() => {
    const q = searchParams.toString()
    router.replace(q ? `/auth/set-password?${q}` : '/auth/set-password')
  }, [router, searchParams])
  return (
    <div className="min-h-screen bg-luxe-black flex items-center justify-center p-4">
      <p className="text-luxe-silver">Weiterleitung...</p>
    </div>
  )
}
