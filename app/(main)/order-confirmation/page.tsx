'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Package, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')

  return (
    <div className="min-h-screen bg-luxe-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-12 pb-12 text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-luxe-neon/20 border-4 border-luxe-neon mb-8"
            >
              <Check className="w-12 h-12 text-luxe-neon" />
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Bestellung erfolgreich!
            </h1>
            <p className="text-luxe-silver text-lg mb-8">
              Vielen Dank für deine Bestellung bei Premium Headshop
            </p>

            {/* Order Number */}
            {orderNumber && (
              <div className="inline-block mb-8 px-6 py-3 bg-luxe-gray rounded-lg border border-luxe-silver/30">
                <p className="text-sm text-luxe-silver mb-1">Deine Bestellnummer</p>
                <p className="text-2xl font-bold text-luxe-gold">{orderNumber}</p>
              </div>
            )}

            {/* Info Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="p-6 bg-luxe-gray rounded-lg text-left">
                <Mail className="w-8 h-8 text-luxe-gold mb-3" />
                <h3 className="text-white font-semibold mb-2">
                  Bestätigung per E-Mail
                </h3>
                <p className="text-sm text-luxe-silver">
                  Du erhältst in Kürze eine Bestellbestätigung an deine E-Mail-Adresse.
                </p>
              </div>
              <div className="p-6 bg-luxe-gray rounded-lg text-left">
                <Package className="w-8 h-8 text-luxe-gold mb-3" />
                <h3 className="text-white font-semibold mb-2">
                  Versand & Tracking
                </h3>
                <p className="text-sm text-luxe-silver">
                  Sobald dein Paket versandt wurde, erhältst du eine Tracking-Nummer.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/account"
                className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
              >
                Zu meinen Bestellungen
                <ArrowRight className="w-4 h-4 ml-2" />
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

        {/* Additional Info */}
        <p className="text-center text-sm text-luxe-silver mt-6">
          Bei Fragen zur Bestellung kontaktiere uns unter{' '}
          <a href="mailto:support@premium-headshop.com" className="text-luxe-gold hover:underline">
            support@premium-headshop.com
          </a>
        </p>
      </motion.div>
    </div>
  )
}
