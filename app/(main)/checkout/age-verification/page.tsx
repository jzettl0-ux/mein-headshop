'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'

export default function AgeVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/checkout'
  const errorParam = searchParams.get('error')
  const { hasAdultItems } = useCartStore()
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(errorParam ? decodeURIComponent(errorParam) : null)

  useEffect(() => {
    if (!hasAdultItems()) {
      router.replace(returnTo)
    }
  }, [hasAdultItems, returnTo, router])

  useEffect(() => {
    if (errorParam) setError(decodeURIComponent(errorParam))
  }, [errorParam])

  const handleStartVerification = async () => {
    setIsVerifying(true)
    setError(null)
    try {
      const res = await fetch('/api/age-verification/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ returnUrl: returnTo }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Die Verifizierung konnte nicht gestartet werden.')
        return
      }

      if (data.token) {
        sessionStorage.setItem('age_verification_token', data.token)
        router.push(returnTo)
        return
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }

      setError('Keine Weiterleitung erhalten. Bitte erneut versuchen.')
    } catch (e) {
      setError('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setIsVerifying(false)
    }
  }

  if (!hasAdultItems()) {
    return (
      <div className="min-h-screen bg-[var(--luxe-black)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--luxe-primary)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--luxe-black)] flex items-center justify-center py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[var(--luxe-primary)]/30 bg-[var(--luxe-primary)]/5 mb-6">
            <Shield className="w-8 h-8 text-[var(--luxe-primary)]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-4">
            Altersverifizierung
          </h1>
          <p className="text-[var(--luxe-silver)] text-base sm:text-lg leading-relaxed max-w-md mx-auto">
            Exklusivität erfordert Verantwortung. Um fortzufahren, bestätigen Sie bitte kurz Ihr Alter.
          </p>
        </div>

        <div className="space-y-8">
          <div className="rounded-xl border border-[var(--luxe-gray)] bg-[var(--luxe-charcoal)] p-6 sm:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--luxe-silver)] mb-4">
              So funktioniert die Prüfung
            </h2>
            <ol className="space-y-3 text-sm text-white/90">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--luxe-primary)]/20 text-[var(--luxe-primary)] text-xs font-semibold">1</span>
                <span>Klicken Sie auf „Alter bestätigen“ – Sie werden zum sicheren Identitätsdienst weitergeleitet.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--luxe-primary)]/20 text-[var(--luxe-primary)] text-xs font-semibold">2</span>
                <span>Folgen Sie den Anweisungen und bestätigen Sie Ihr Alter (z.B. per Ausweis oder Video-Ident).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--luxe-primary)]/20 text-[var(--luxe-primary)] text-xs font-semibold">3</span>
                <span>Nach erfolgreicher Prüfung kehren Sie automatisch zum Checkout zurück.</span>
              </li>
            </ol>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="luxe"
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleStartVerification}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Wird geprüft…
                </>
              ) : (
                <>
                  Alter bestätigen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-[var(--luxe-gray)] text-[var(--luxe-silver)]"
              onClick={() => router.push('/cart')}
              disabled={isVerifying}
            >
              Zurück zum Warenkorb
            </Button>
          </div>
        </div>

        <p className="mt-10 text-xs text-[var(--luxe-silver)]/60 text-center max-w-md mx-auto">
          Wir speichern keine Ausweisdaten. Es wird ausschließlich das Ergebnis der Prüfung (Freigabe/ Ablehnung) verarbeitet.
        </p>
      </motion.div>
    </div>
  )
}
