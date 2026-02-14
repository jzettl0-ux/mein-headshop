'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)
  const orderNumber = searchParams.get('order')

  useEffect(() => {
    // Simuliere Payment-Verifizierung
    setTimeout(() => {
      setIsVerifying(false)
    }, 2000)
  }, [])

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

  return (
    <div className="min-h-screen bg-luxe-black flex items-center justify-center p-4">
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
              <div className="inline-block mb-8 px-6 py-3 bg-luxe-gray rounded-lg border border-luxe-silver/30">
                <p className="text-sm text-luxe-silver mb-1">Bestellnummer</p>
                <p className="text-2xl font-bold text-luxe-gold">{orderNumber}</p>
              </div>
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
