'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle } from 'lucide-react'

/**
 * Phase 4.1: Zwischenseite nach Provider-Redirect
 * Liest token + returnTo aus URL, speichert Token in sessionStorage, leitet zum Checkout weiter
 */
export default function AgeVerificationDonePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const returnTo = searchParams.get('returnTo') || '/checkout'

  useEffect(() => {
    if (!token) {
      router.replace('/checkout?av_error=Token fehlt')
      return
    }
    sessionStorage.setItem('age_verification_token', token)
    router.replace(returnTo)
  }, [token, returnTo, router])

  return (
    <div className="min-h-screen bg-[var(--luxe-black)] flex flex-col items-center justify-center py-16 px-4">
      <Loader2 className="w-10 h-10 text-[var(--luxe-primary)] animate-spin mb-4" />
      <p className="text-white text-lg flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-500" />
        Altersverifizierung erfolgreich – Weiterleitung zum Checkout…
      </p>
    </div>
  )
}
