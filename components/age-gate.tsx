'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isAgeVerified, setAgeVerified } from '@/lib/utils'

/**
 * Age-Gate Overlay
 * Erscheint beim ersten Besuch und prüft das Alter des Users
 * Speichert die Verifizierung für 30 Tage in LocalStorage
 */
export function AgeGate() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user has already verified their age
    if (!isAgeVerified()) {
      // Small delay for better UX
      setTimeout(() => setIsOpen(true), 500)
    }
  }, [])

  const handleVerify = () => {
    setAgeVerified()
    setIsOpen(false)
  }

  const handleDecline = () => {
    // Redirect to a "not allowed" page or external site
    window.location.href = 'https://www.google.com'
  }

  if (!mounted) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-luxe-black/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="relative w-full max-w-md mx-4"
          >
            <div className="bg-luxe-charcoal border border-luxe-gray rounded-2xl p-8 md:p-12 shadow-2xl">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-luxe-gold/10 rounded-full border border-luxe-gold/30">
                  <Shield className="w-12 h-12 text-luxe-gold" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-4 mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  Altersverifizierung
                </h2>
                <p className="text-luxe-silver text-sm leading-relaxed">
                  Dieser Onlineshop verkauft Produkte, die nur an Personen über 18 Jahre verkauft werden dürfen.
                </p>
                <p className="text-luxe-silver text-sm leading-relaxed">
                  Bist du mindestens 18 Jahre alt?
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleVerify}
                  variant="luxe"
                  size="lg"
                  className="w-full text-base"
                >
                  Ja, ich bin 18 Jahre oder älter
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  size="lg"
                  className="w-full border-luxe-gray hover:bg-luxe-gray/20 text-base"
                >
                  Nein, ich bin noch keine 18
                </Button>
              </div>

              {/* Legal Notice */}
              <p className="mt-6 text-xs text-luxe-silver/60 text-center">
                Durch Bestätigung erklärst du, dass du mindestens 18 Jahre alt bist.
                <br />
                Die Verifizierung wird für 30 Tage gespeichert.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
