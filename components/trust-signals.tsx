'use client'

import Link from 'next/link'
import { Shield, Lock, Truck, Award } from 'lucide-react'

/**
 * Vertrauenssignale (Trusted Shops / EHI / Zertifikate) – Clean Luxe.
 * Platzhalter für Trusted Shops / EHI-Siegel: Badge-URL oder Widget einbinden.
 */
const TRUSTED_SHOPS_BADGE_URL = process.env.NEXT_PUBLIC_TRUSTED_SHOPS_BADGE_URL
const EHI_SIEGEL_URL = process.env.NEXT_PUBLIC_EHI_SIEGEL_URL

export function TrustSignals() {
  return (
    <section
      className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 py-6 text-sm text-luxe-silver"
      aria-label="Vertrauenssignale"
    >
      {TRUSTED_SHOPS_BADGE_URL && (
        <a
          href="https://www.trustedshops.de"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 hover:opacity-90"
          aria-label="Trusted Shops Gütesiegel"
        >
          <img src={TRUSTED_SHOPS_BADGE_URL} alt="Trusted Shops" className="h-8 w-auto object-contain" />
        </a>
      )}
      {EHI_SIEGEL_URL && (
        <img src={EHI_SIEGEL_URL} alt="EHI Geprüfter Shop" className="h-8 w-auto object-contain" aria-hidden />
      )}
      <span className="inline-flex items-center gap-2" aria-hidden="true">
        <Lock className="w-4 h-4 text-luxe-primary" aria-hidden />
        SSL-verschlüsselt
      </span>
      <span className="inline-flex items-center gap-2" aria-hidden="true">
        <Shield className="w-4 h-4 text-luxe-primary" aria-hidden />
        Sichere Zahlung
      </span>
      <Link href="/a-z-garantie" className="inline-flex items-center gap-2 hover:text-luxe-primary transition-colors">
        <Shield className="w-4 h-4 text-luxe-primary" aria-hidden />
        A–Z Käuferschutz
      </Link>
      <span className="inline-flex items-center gap-2" aria-hidden="true">
        <Truck className="w-4 h-4 text-luxe-primary" aria-hidden />
        Schneller Versand
      </span>
      <span className="inline-flex items-center gap-2" aria-hidden="true">
        <Award className="w-4 h-4 text-luxe-primary" aria-hidden />
        Bewertungen von Kunden
      </span>
    </section>
  )
}
