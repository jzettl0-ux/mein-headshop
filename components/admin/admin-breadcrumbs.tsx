'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const PATH_LABELS: Record<string, string> = {
  '': 'Übersicht',
  orders: 'Bestellungen',
  products: 'Produkte',
  influencers: 'Influencer',
  assets: 'Mediathek',
  startseite: 'Startseite',
  requests: 'Stornos & Rücksendungen',
  support: 'Kundenservice',
  messaging: 'Nachrichten (Anti-Poaching)',
  feedback: 'Feedback',
  suggestions: 'Verbesserungsvorschläge',
  reviews: 'Produktbewertungen',
  'shop-reviews': 'Shop-Bewertungen',
  ugc: 'Rate my Setup (UGC)',
  'discount-codes': 'Rabattcodes',
  coupons: 'Voucher-Badges',
  preview: 'Bildvorschau',
  'affiliate-links': 'Affiliate / PartnerNet',
  policies: 'Policies',
  campaigns: 'Kampagnen',
  targets: 'Ziele',
  gaps: 'Suchbegriff-Lücken',
  recommendations: 'Empfehlungen',
  sales: 'Verkaufsübersicht',
  marketing: 'Marketing',
  referrals: 'Empfehlungsprogramm',
  newsletter: 'Newsletter',
  customers: 'Kundenwert',
  loyalty: 'Treue & Punkte',
  finances: 'Finanzen',
  integrations: 'Schnittstellen',
  suppliers: 'Lieferanten',
  margin: 'Kostenrechner',
  repricer: 'Repricer',
  'asin-locks': 'ASIN-Sperren',
  mcf: 'Multi-Channel',
  inventory: 'Lager',
  health: 'Lager-Gesundheit',
  wareneingang: 'Wareneingang',
  settings: 'Einstellungen',
  env: 'Umgebung & .env',
  shipping: 'Versand & Logistik',
  shop: 'Shop & Versand',
  media: 'Medien',
  team: 'Team',
  contracts: 'Verträge',
  legal: 'Rechtstexte',
  'employee-contract': 'Mitarbeitervertrag',
  audit: 'Audit-Log',
  staff: 'Mitarbeiter',
  costs: 'Kosten & Steuern',
  datenschutz: 'DSGVO – Kundendaten',
  complaints: 'Beschwerden',
  new: 'Neu',
  edit: 'Bearbeiten',
  mapping: 'Zuordnung',
  'category-gating': 'Kategorien-Freigabe',
  'commission-rules': 'Provisionsregeln',
  'vendor-performance': 'Vendor-Metriken',
  'ddg-reports': 'DDG-Meldungen',
  'brand-registry': 'Markenregister',
  'eco-certifications': 'Eco-Zertifizierungen',
  'asin-registry': 'ASIN-Registry',
  'a-to-z': 'A-bis-z-Garantie',
  'safet-claims': 'SAFE-T Claims',
  'product-qa': 'Produkt-Fragen',
  vine: 'Vine-Programm',
  'aplus-content': 'A+ Inhalt',
  'lightning-deals': 'Blitz-Angebote',
  'vault-drops': '4:20 Vault',
  epr: 'EPR-Registrierungen',
  'percolate-rules': 'Compliance-Filter',
  'blended-shipping': 'Kombinierter Versand',
  'frequently-bought-together': 'Oft gemeinsam gekauft',
  'shoppable-videos': 'Shopbare Videos',
  advertising: 'PPC Kampagnen',
  b2b: 'B2B-Konten',
  approvals: 'Freigaben',
  accounts: 'Konten',
  'tiered-pricing': 'Staffelpreise',
  operations: 'Einkauf',
  expenses: 'Ausgaben',
  analytics: 'Auswertungen',
  trends: 'Saisonale Trends',
  compliance: 'Compliance-Zentrum',
  transparency: 'Transparenz',
  recalls: 'Produktrückrufe',
  webhooks: 'Webhook-Log',
  'domain-events': 'Domain-Ereignisse',
  recommerce: 'Re-Commerce',
  'trade-ins': 'Trade-In',
  'product-guidance': 'Product Guidance',
  'ab-experiments': 'A/B-Tests',
  attribution: 'Attribution',
  hazmat: 'Gefahrgut',
  rfq: 'Angebotsanfragen (RFQ)',
  ux: 'UX & Funnel',
  'component-registry': 'Komponenten-Registry',
  'homepage-layouts': 'Startseiten-Layouts',
  replenishment: 'Erneut kaufen',
  'category-facets': 'Category Facets',
  carts: 'Warenkörbe',
  'checkout-dropoffs': 'Checkout-Abbrüche',
  'search-terms': 'Suchbegriffe',
  ncx: 'NCX-Score',
  'search-frequency-rank': 'Suchfrequenz-Rang',
  widgets: 'Widgets',
  'retail-media': 'Retail Media',
  'native-banners': 'Native Banners',
  editorials: 'Shoppable Editorials',
  sensory: 'Sensory',
  'brand-boutiques': 'Brand Boutiques',
  'base-pricing': 'PAngV Grundpreis',
  'geo-restrictions': 'Geo-Restriktionen',
  'project-zero': 'Project Zero',
  csba: 'Kundenservice-Auslagerung',
  launchpad: 'Launchpad',
  'market-basket': 'Market Basket',
  reimbursements: 'Erstattungen',
  warranties: 'Garantien',
  'vendor-central': 'Vendor Central',
  'wave-picking': 'Wellen-Kommissionierung',
  'map-enforcement': 'Mindestpreis-Durchsetzung',
  'returnless-refunds': 'Erstattung ohne Rücksendung',
  'vendor-flex': 'Vendor Flex',
  'fraud-scores': 'Betrugsprävention',
  factoring: 'B2B Factoring',
  'tailored-promotions': 'Tailored Promotions',
  enterprise: 'Enterprise',
  punchout: 'PunchOut (SAP/Coupa)',
  crap: 'CRAP-Algorithmus',
  'inventory-lots': 'FEFO Lot-Tracking',
  creator: 'Creator Storefronts',
  'velocity-anomalies': 'Anti-Hijacking',
  'oss-threshold': 'OSS Threshold',
}

export function AdminBreadcrumbs() {
  const pathname = usePathname() ?? ''
  if (!pathname.startsWith('/admin')) return null
  const segments = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean)
  if (segments.length === 0) return null

  const crumbs: { href: string; label: string }[] = [
    { href: '/admin', label: 'Übersicht' },
  ]
  let acc = '/admin'
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    acc += `/${seg}`
    const label = PATH_LABELS[seg] ?? (seg.length === 36 || /^[0-9a-f-]{36}$/i.test(seg) ? `#${seg.slice(0, 8)}` : seg)
    crumbs.push({ href: acc, label })
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm text-luxe-silver mb-6" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-4 h-4 text-luxe-silver/60" />}
            {isLast ? (
              <span className="font-medium text-white">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-luxe-gold transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
