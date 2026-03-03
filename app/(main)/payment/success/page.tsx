'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { SPRUECHE_BESTELLUNG_ERFOLG, getRandomSpruch } from '@/lib/kiffer-sprueche'
import { CheckoutGuard } from '@/components/checkout-guard'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(true)
  const [syncResult, setSyncResult] = useState<{ paid: boolean; error?: string; status?: string } | null>(null)
  const retryDoneRef = useRef(false)
  const orderNumber = searchParams.get('order')
  const spruch = useMemo(
    () => getRandomSpruch(SPRUECHE_BESTELLUNG_ERFOLG, orderNumber ?? undefined),
    [orderNumber]
  )

  useEffect(() => {
    if (!orderNumber) {
      setIsVerifying(false)
      setSyncResult({ paid: false, error: 'Keine Bestellnummer' })
      return
    }
    let cancelled = false
    const doSync = () => {
      fetch(`/api/payment/sync?order=${encodeURIComponent(orderNumber)}`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return
          const paid = data.paid === true
          const stillPending = !paid && (data.status === 'open' || data.status === 'pending')
          setSyncResult({
            paid,
            error: data.error,
            status: data.status,
          })
          // Einmal automatisch erneut prüfen, wenn Mollie noch "open"/"pending" meldet (z. B. bei PayPal)
          if (stillPending && !retryDoneRef.current) {
            retryDoneRef.current = true
            setTimeout(() => {
              if (cancelled) return
              doSync()
            }, 3500)
          } else {
            if (!cancelled) setIsVerifying(false)
          }
        })
        .catch(() => {
          if (cancelled) return
          setSyncResult({ paid: false, error: 'Verbindungsfehler' })
          setIsVerifying(false)
        })
    }
    doSync()
    return () => { cancelled = true }
  }, [orderNumber])

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-luxe-gold animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Zahlung wird überprüft...</p>
        </div>
      </div>
    )
  }

  if (syncResult && !syncResult.paid) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center p-4">
        <Card className="bg-luxe-charcoal border-luxe-gray max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
            <h1 className="text-xl font-bold text-white mb-2">Zahlung noch offen</h1>
            <p className="text-luxe-silver text-sm mb-6">
              {syncResult.error === 'Nicht angemeldet'
                ? 'Bitte melde dich an und öffne den Link erneut, dann wird der Status aktualisiert.'
                : syncResult.error?.includes('SUPABASE_SERVICE_ROLE_KEY')
                  ? 'Die Zahlung wurde angenommen. Der Bestellstatus wird in Kürze aktualisiert – bei Fragen den Shop-Betreiber kontaktieren.'
                  : syncResult.error || 'Die Zahlung ist bei uns noch nicht als bezahlt erfasst. Sobald die Zahlung bestätigt ist, siehst du den Status in deinen Bestellungen.'}
            </p>
            {orderNumber && (
              <p className="text-luxe-silver text-xs mb-6">Bestellnummer: <span className="text-luxe-gold">{orderNumber}</span></p>
            )}
            <Link
              href="/account"
              className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold"
            >
              Zu meinen Bestellungen
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxe-black flex items-center justify-center p-4">
      <CheckoutGuard />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-12 pb-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-luxe-neon/20 border-4 border-luxe-neon mb-8"
            >
              <Check className="w-12 h-12 text-luxe-neon" />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Zahlung erfolgreich!
            </h1>
            <p className="text-luxe-silver text-lg mb-8">
              Deine Bestellung wurde bezahlt und wird jetzt bearbeitet
            </p>

            {orderNumber && (
              <div className="inline-block mb-6 px-6 py-3 bg-luxe-gray rounded-lg border border-luxe-silver/30">
                <p className="text-sm text-luxe-silver mb-1">Bestellnummer</p>
                <p className="text-2xl font-bold text-luxe-gold">{orderNumber}</p>
              </div>
            )}

            {spruch && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8 px-6 py-4 rounded-xl bg-luxe-primary/15 border border-luxe-primary/30 text-center"
              >
                <Sparkles className="w-5 h-5 text-luxe-primary mx-auto mb-2 opacity-80" />
                <p className="text-luxe-primary font-medium text-sm md:text-base italic">
                  „{spruch}"
                </p>
              </motion.div>
            )}

            <div className="bg-luxe-gold/10 border border-luxe-gold/30 rounded-lg p-6 mb-8">
              <h3 className="text-white font-semibold mb-2">📧 Bestätigung per Email</h3>
              <p className="text-luxe-silver text-sm">
                Du erhältst in Kürze eine Bestellbestätigung an deine Email-Adresse 
                mit allen Details und der Tracking-Nummer sobald dein Paket versandt wurde.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/account"
                className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
              >
                Zu meinen Bestellungen
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center h-11 rounded-md px-8 border border-luxe-gray hover:bg-luxe-gray/20 text-white transition-colors"
              >
                Weiter shoppen
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
