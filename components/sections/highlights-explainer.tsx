'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp } from 'lucide-react'

/**
 * Kurze Erklärung für Kunden: Was bedeuten Store-Highlights vs. Bestseller?
 * Steht auf der Startseite direkt vor den beiden Produktbereichen.
 */
export function HighlightsExplainer() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container-luxe py-6"
      aria-label="Erklärung zu unseren Empfehlungen"
    >
      <div className="max-w-3xl mx-auto px-4 py-4 rounded-xl bg-luxe-charcoal/80 border border-luxe-gray/50">
        <p className="text-luxe-silver text-sm text-center mb-4">
          So unterscheiden wir unsere Empfehlungen:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-luxe-gold/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-luxe-gold" />
            </span>
            <div>
              <span className="font-semibold text-white">Store-Highlights</span>
              <p className="text-luxe-silver mt-0.5">
                Von uns handverlesen – Produkte, die wir dir besonders ans Herz legen.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </span>
            <div>
              <span className="font-semibold text-white">Bestseller</span>
              <p className="text-luxe-silver mt-0.5">
                Von euch gewählt – die am häufigsten gekauften Artikel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
