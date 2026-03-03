'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Weiterleitung auf den einheitlichen Auth-Einstieg. */
export default function LoginForgotPasswordRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/auth/forgot-password')
  }, [router])
  return (
    <div className="min-h-screen bg-luxe-black flex items-center justify-center p-4">
      <p className="text-luxe-silver">Weiterleitung...</p>
    </div>
  )
}
