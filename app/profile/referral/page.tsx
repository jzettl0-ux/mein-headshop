'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Weiterleitung: Mein Konto ist unter /account zusammengeführt. */
export default function ProfileReferralRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/account/referral')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <p className="text-muted-foreground">Weiterleitung zum Konto...</p>
    </div>
  )
}
