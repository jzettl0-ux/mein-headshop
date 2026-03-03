import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

/**
 * Edles Trust-Element für den Footer: verlinkt auf die öffentliche Compliance-Seite.
 * Clean Luxe: dezent, 1px Linie, kleines Siegel-Icon.
 */
export function ComplianceTrustBadge() {
  return (
    <Link
      href="/compliance"
      className="inline-flex items-center gap-1.5 border border-luxe-gray/60 bg-luxe-charcoal/50 px-3 py-1.5 text-xs text-luxe-silver transition-colors hover:border-luxe-primary/50 hover:text-luxe-gold focus:outline-none focus:ring-1 focus:ring-luxe-primary"
      aria-label="Compliance- und Transparenzbericht anzeigen"
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-luxe-primary/80" aria-hidden />
      <span>BFSG 2025 Konform</span>
      <span className="text-luxe-gray">|</span>
      <span>Sicherheitsgeprüft {new Date().getFullYear()}</span>
    </Link>
  )
}
