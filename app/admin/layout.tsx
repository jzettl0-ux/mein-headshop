'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, PackagePlus, Users, User, Store, LogOut, Palette, TicketPercent, Calculator, Home, Star, HeadphonesIcon, UserCog, MessageSquareWarning, MessageCircleQuestion, AlertCircle, TrendingUp, TrendingDown, Plug, Truck, Banknote, Bell, History, MessageSquare, Gift, UserPlus, Image, Smartphone, Mail, ChevronDown, ChevronRight, PanelLeftClose, PanelLeft, Search, Activity, ShieldCheck, ShoppingCart, Receipt, Lightbulb, Zap, Video, Building2, Link2, RefreshCw, Lock, Camera, FileText, Layout, LayoutGrid, BarChart3, ExternalLink, Globe, ShoppingBag, Shield, Tag, CreditCard, ClipboardCheck, Copy, ShieldAlert, ShieldOff, SlidersHorizontal, Award, Eye, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { Logo } from '@/components/logo'
import { getCurrentUser, signOut, onAuthStateChange } from '@/lib/supabase/auth'
import { OWNER_EMAIL } from '@/lib/owner-email'
import { useToast } from '@/hooks/use-toast'

type NavItem = {
  href?: string
  label: string
  /** Kurze Erklärung für Tooltip (hilft bei Orientierung) */
  description?: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
  children?: NavItem[]
}
type NavGroup = {
  title: string
  /** Erklärung, was dieser Bereich macht */
  description?: string
  items: NavItem[]
}

/** Flache Liste aller Links (inkl. Kinder) für Filterung */
function collectHrefs(item: NavItem): string[] {
  const out: string[] = []
  if (item.href) out.push(item.href)
  item.children?.forEach((c) => out.push(...collectHrefs(c)))
  return out
}
function itemMatchesPath(item: NavItem, pathname: string): boolean {
  if (item.href && (pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)))) return true
  return item.children?.some((c) => itemMatchesPath(c, pathname)) ?? false
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [isStaffManager, setIsStaffManager] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [sidebarSlim, setSidebarSlim] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [openSubItems, setOpenSubItems] = useState<Set<string>>(new Set())
  const [navSearch, setNavSearch] = useState('')
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const { toast } = useToast()

  const STORAGE_NAV_OPEN = 'admin-nav-open'
  const STORAGE_NAV_SLIM = 'admin-nav-slim'

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setUnauthorized(false)
      if (!currentUser) {
        setIsLoading(false)
        router.push('/auth?redirect=/admin')
        return
      }
      try {
        const res = await fetch('/api/admin/me')
        if (!res.ok) {
          if (res.status === 401) {
            setUnauthorized(true)
            setRoles([])
            setIsStaffManager(false)
          } else {
            router.push('/auth?redirect=/admin')
            return
          }
        } else {
          const data = await res.json()
          setRoles(Array.isArray(data.roles) ? data.roles : data.role ? [data.role] : ['owner'])
          setIsOwner(!!data.isOwner)
          setIsStaffManager(!!data.isStaffManager)
        }
      } catch {
        const ownerEmail = currentUser?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()
        setRoles(ownerEmail ? ['owner'] : [])
        setIsOwner(ownerEmail)
        setIsStaffManager(ownerEmail)
      }
      setIsLoading(false)
    }
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((newUser) => {
      setUser(newUser)
      if (!newUser) {
        router.push('/auth?redirect=/admin')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Benachrichtigungs-Count für Glocken-Badge (wenn eingeloggt und berechtigt)
  useEffect(() => {
    if (!user || unauthorized) {
      setNotificationCount(0)
      return
    }
    fetch('/api/admin/notifications')
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => setNotificationCount(typeof data.count === 'number' ? data.count : 0))
      .catch(() => setNotificationCount(0))
  }, [user, unauthorized, pathname])

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: 'Erfolgreich abgemeldet',
        description: 'Bis bald!',
      })
      router.push('/auth?redirect=/admin')
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        title: 'Fehler beim Abmelden',
        variant: 'destructive',
      })
    }
  }

  /** Amazon-Style Navigation: Klar strukturiert, alles auf Deutsch, mit Erklärungen */
  const navGroups: NavGroup[] = [
    {
      title: 'Start',
      description: 'Dashboard mit Überblick über deinen Shop',
      items: [
        { href: '/admin', label: 'Übersicht', description: 'Zusammenfassung: Bestellungen, Umsatz, offene Aufgaben', icon: LayoutDashboard, roles: ['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'hr', 'team_leader', 'warehouse_lead', 'marketing'] },
        { href: '/admin/me', label: 'Mein Profil', description: 'Deine Rollen, Stammbaum und Ansprechpartner', icon: User, roles: ['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'hr', 'team_leader', 'warehouse_lead', 'marketing'] },
        { href: '/admin/messages', label: 'Interner Chat', description: 'Nachrichten an Vorgesetzte und Mitarbeiter', icon: MessageSquare, roles: ['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'hr', 'team_leader', 'warehouse_lead', 'marketing'] },
      ],
    },

    {
      title: 'Bestellungen',
      description: 'Alle Kundenbestellungen verwalten',
      items: [
        { href: '/admin/orders', label: 'Bestellungen', description: 'Bestellungen einsehen, Status ändern, Tracking eintragen', icon: Package, roles: ['owner', 'chef', 'admin', 'support', 'employee', 'team_leader', 'warehouse_lead'] },
        { href: '/admin/requests', label: 'Stornos & Rücksendungen', description: 'Storno- und Rücksendeanfragen bearbeiten', icon: AlertCircle, roles: ['owner', 'chef', 'admin', 'support', 'employee', 'team_leader', 'warehouse_lead'] },
      ],
    },

    {
      title: 'Kundenservice',
      description: 'Anfragen, Beschwerden und Garantien',
      items: [
        { href: '/admin/support', label: 'Kundenanfragen', description: 'Eingegangene Kontakt- und Support-Anfragen bearbeiten', icon: HeadphonesIcon, roles: ['owner', 'chef', 'admin', 'support', 'employee', 'team_leader'] },
        { href: '/admin/support/messaging', label: 'Nachrichten (Anti-Poaching)', description: 'Buyer-Seller-Messages, Regex-Flag, Status', icon: MessageSquare, roles: ['owner', 'chef', 'admin', 'support'] },
        { href: '/admin/complaints', label: 'Beschwerden', description: 'Kundenbeschwerden verwalten', icon: MessageSquareWarning, roles: ['owner', 'chef'] },
        { href: '/admin/a-to-z', label: 'A-bis-z-Garantie', description: 'Garantie-Ansprüche bearbeiten', icon: ShieldCheck, roles: ['owner', 'chef', 'admin', 'support', 'employee', 'team_leader'] },
        { href: '/admin/safet-claims', label: 'SAFE-T Claims', description: 'Erstattungs-Ansprüche verwalten', icon: ShieldCheck, roles: ['owner', 'chef', 'admin', 'support'] },
      ],
    },

    {
      title: 'Produkte & Sortiment',
      description: 'Artikel, Kategorien und Shop-Inhalte',
      items: [
        { href: '/admin/products', label: 'Produkte', description: 'Produkte anlegen, bearbeiten, Preise & Lager', icon: Package, roles: ['owner', 'chef', 'admin', 'product_care'] },
        { href: '/admin/categories', label: 'Kategorien', description: 'Haupt- und Unterkategorien für den Shop', icon: Package, roles: ['owner', 'chef', 'admin', 'product_care'] },
        { href: '/admin/influencers', label: 'Influencer', description: 'Partner mit eigenen Produktseiten und Provisionen', icon: Users, roles: ['owner', 'chef', 'admin', 'product_care'] },
        {
          label: 'Medien',
          description: 'Bilder und Assets für Produkte',
          icon: Image,
          roles: ['owner', 'chef', 'admin', 'product_care'],
          children: [
            { href: '/admin/assets', label: 'Mediathek', description: 'Bilder hochladen und verwalten', icon: Image, roles: ['owner', 'chef', 'admin', 'product_care'] },
            { href: '/admin/assets/preview', label: 'Vorschau', description: 'Produktbilder als Feed/Story-Vorschau', icon: Smartphone, roles: ['owner', 'chef', 'admin', 'product_care'] },
          ],
        },
        { href: '/admin/startseite', label: 'Startseite', description: 'Hero, Kategorien und Influencer auf der Startseite', icon: Home, roles: ['owner', 'chef', 'admin', 'product_care'] },
        { href: '/admin/brand-registry', label: 'Markenregister', description: 'Registrierte Marken verwalten', icon: ShieldCheck, roles: ['owner', 'chef', 'admin', 'product_care'] },
        { href: '/admin/eco-certifications', label: 'Öko-Zertifizierungen', description: 'Bio- und Nachhaltigkeits-Zertifikate', icon: ShieldCheck, roles: ['owner', 'chef', 'admin', 'product_care'] },
        { href: '/admin/product-qa', label: 'Produkt-Fragen & Antworten', description: 'Kundenfragen zu Produkten moderieren', icon: MessageCircleQuestion, roles: ['owner', 'chef', 'admin', 'product_care', 'support', 'employee'] },
      ],
    },

    {
      title: 'Bewertungen & Feedback',
      description: 'Meinungen von Kunden und Verbesserungsvorschläge',
      items: [
        { href: '/admin/reviews', label: 'Produktbewertungen', description: 'Sterne-Bewertungen zu Produkten moderieren', icon: MessageSquare, roles: ['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'team_leader', 'warehouse_lead'] },
        { href: '/admin/shop-reviews', label: 'Shop-Bewertungen', description: 'Bewertungen zum gesamten Shop', icon: Star, roles: ['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'team_leader', 'warehouse_lead'] },
        { href: '/admin/feedback', label: 'Feedback', description: 'Allgemeines Kundenfeedback', icon: Star, roles: ['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'team_leader', 'warehouse_lead'] },
        { href: '/admin/suggestions', label: 'Verbesserungsvorschläge', description: 'Ideen von Kunden für den Shop', icon: Lightbulb, roles: ['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'team_leader', 'warehouse_lead'] },
        { href: '/admin/ugc', label: 'Rate my Setup', description: 'Kunden-Fotos von ihrem Setup', icon: Camera, roles: ['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'team_leader', 'warehouse_lead'] },
        { href: '/admin/vine', label: 'Vine-Programm', description: 'Produkte für Test-Bewertungen versenden', icon: Gift, roles: ['owner', 'chef', 'admin', 'product_care'] },
        { href: '/admin/subscriptions', label: 'Subscribe & Save', description: 'Spar-Abos verwalten', icon: RefreshCw, roles: ['owner', 'chef', 'admin', 'support'] },
      ],
    },

    {
      title: 'Marketing & Vertrieb',
      description: 'Rabatte, Newsletter und Werbung',
      items: [
        { href: '/admin/sales', label: 'Verkaufsübersicht', description: 'Umsatz, Top-Produkte, Trends', icon: TrendingUp, roles: ['owner', 'chef', 'admin', 'product_care'] },
        { href: '/admin/discount-codes', label: 'Rabattcodes', description: 'Gutschein-Codes anlegen (z.B. WINTER10)', icon: TicketPercent, roles: ['owner', 'chef', 'admin', 'marketing'] },
        { href: '/admin/coupons', label: 'Voucher-Badges', description: 'Prozent- oder Festbetrag-Badges auf Produkten', icon: TicketPercent, roles: ['owner', 'chef', 'admin', 'marketing'] },
        { href: '/admin/lightning-deals', label: 'Blitz-Angebote', description: 'Zeitlich begrenzte Schnäppchen', icon: Zap, roles: ['owner', 'chef', 'admin', 'marketing'] },
        { href: '/admin/vault-drops', label: '4:20 Vault', description: 'Exklusive Drops und Aktionen', icon: Lock, roles: ['owner', 'chef', 'admin', 'marketing'] },
        { href: '/admin/advertising', label: 'Werbung (PPC)', description: 'Bezahlte Anzeigen und Kampagnen', icon: TrendingUp, roles: ['owner', 'chef', 'admin', 'marketing'] },
        { href: '/admin/marketing/newsletter', label: 'Newsletter', description: 'E-Mail-Marketing und Abonnenten', icon: Mail, roles: ['owner', 'chef', 'admin', 'marketing'] },
        { href: '/admin/marketing/referrals', label: 'Empfehlungsprogramm', description: 'Provision für Weiterempfehlungen', icon: UserPlus, roles: ['owner', 'chef', 'admin', 'marketing'] },
        { href: '/admin/affiliate-links', label: 'Partner-Links', description: 'Affiliate- und PartnerNet-Links', icon: Link2, roles: ['owner', 'chef', 'admin', 'marketing'] },
        { href: '/admin/aplus-content', label: 'A+ Inhalt', description: 'Zusätzliche Produkttexte und Layouts', icon: Image, roles: ['owner', 'chef', 'admin', 'marketing'] },
        { href: '/admin/shoppable-videos', label: 'Shopbare Videos', description: 'Videos mit klickbaren Produkten', icon: Video, roles: ['owner', 'chef', 'admin', 'marketing'] },
      ],
    },

    {
      title: 'Lager & Versand',
      description: 'Bestände, Wareneingang, Lieferanten',
      items: [
        { href: '/admin/inventory', label: 'Lagerbestand', description: 'Bestand pro Produkt, Nachbestell-Vorschläge', icon: Package, roles: ['owner', 'chef', 'warehouse_lead'] },
        { href: '/admin/inventory/wareneingang', label: 'Wareneingang', description: 'Eingegangene Lieferungen erfassen', icon: PackagePlus, roles: ['owner', 'chef', 'warehouse_lead'] },
        { href: '/admin/inventory/health', label: 'Lager-Gesundheit', description: 'Restock-Empfehlungen, Überbestände', icon: Package, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/inventory/stranded', label: 'Stranded Inventory', description: 'Gestrandete Bestände (Listing gelöscht, Compliance)', icon: Package, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/suppliers', label: 'Lieferanten', description: 'Lieferanten verwalten und zuordnen', icon: Truck, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/margin', label: 'Kostenrechner', description: 'Einkauf, Versand, Marge berechnen', icon: Calculator, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/frequently-bought-together', label: 'Oft gemeinsam gekauft', description: 'Produkt-Empfehlungen „Kunden kauften auch“', icon: Package, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/frequently-bought-together/virtual-bundles', label: 'Virtual Bundles', description: 'Bundle-ASIN + Komponenten (catalog ASIN)', icon: Package, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/repricer', label: 'Repricer', description: 'Preise automatisch anpassen', icon: TrendingDown, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/asin-locks', label: 'ASIN-Locks', description: 'ASIN-Sperren verwalten', icon: Lock, roles: ['owner', 'chef', 'admin'] },
      ],
    },

    {
      title: 'Finanzen & Einkauf',
      description: 'Umsätze, Einkauf, Ausgaben',
      items: [
        { href: '/admin/finances', label: 'Finanz-Dashboard', description: 'Umsatz, Ausgaben, Übersicht', icon: Banknote, roles: ['owner'] },
        { href: '/admin/operations', label: 'Einkauf', description: 'Bestellungen bei Lieferanten', icon: ShoppingCart, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/operations/expenses', label: 'Ausgaben', description: 'Kosten für BWA und Buchhaltung', icon: Receipt, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/operations/returnless-refunds', label: 'Erstattung ohne Rücksendung', description: 'Guthaben gewähren ohne physische Rücksendung', icon: RefreshCw, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/operations/return-inspections', label: 'Retourenprüfung', description: 'Übersicht Retourenprüfungen, Zustand, Restocking Fee', icon: ClipboardCheck, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/operations/reimbursements', label: 'Erstattungen', description: 'Verlust-/Schaden-Erstattungen von Lager/Lieferanten', icon: Package, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/operations/warranties', label: 'Garantien', description: 'Fremdgarantien von Drittanbietern', icon: Shield, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/integrations', label: 'Schnittstellen', description: 'APIs, Mollie, Versanddienstleister', icon: Plug, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/mcf', label: 'Multi-Channel', description: 'Bestellungen aus anderen Shops', icon: Truck, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/vendors', label: 'Vendors', description: 'Marktplatz-Verkäufer', icon: Store, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/operations/catalog-duplicates', label: 'Catalog Duplicates', description: 'Katalog-Duplikate (Bild-Ähnlichkeit)', icon: Copy, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/operations/risk-evaluations', label: 'Risk Evaluations', description: 'Risikobewertungen pro Bestellung', icon: ShieldAlert, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/operations/payout-batches', label: 'Payout Batches', description: 'Auszahlungsbatches pro Vendor', icon: Banknote, roles: ['owner'] },
        { href: '/admin/operations/live-streams', label: 'Live-Streams', description: 'Streams anlegen, HLS-URL, Produkte zuordnen', icon: Video, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/operations/bin-packing', label: '3D Bin-Packing', description: 'Standard-Boxen, Verpackungsplan pro Bestellung', icon: Package, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/operations/routing-rules', label: 'Small & Light (Routing)', description: 'Briefversand-Regeln nach Gewicht/Dicke/Preis', icon: Package, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/operations/product-attributes', label: 'Product Attributes', description: 'Gewicht/Dicke pro Produkt (Small & Light)', icon: Package, roles: ['owner', 'chef', 'admin'] },
      ],
    },

    {
      title: 'Kunden',
      description: 'Stammdaten, Treue, B2B',
      items: [
        { href: '/admin/customers', label: 'Kundenübersicht', description: 'Kundenwert (LTV), Stammdaten', icon: Users, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/review-requests', label: 'Bewertungsanfragen', description: 'Review Requests 5–30 Tage nach Lieferung', icon: Star, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/loyalty', label: 'Treueprogramm', description: 'Punkte, Belohnungen, Einlösung', icon: Gift, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/customers/fraud-scores', label: 'Betrugsprävention', description: 'Bewertungsscore pro Kunde – Risiko erkennen', icon: Shield, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/b2b', label: 'B2B-Geschäftskonten', description: 'Firmenkunden und Rahmenverträge', icon: Building2, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/b2b/rfq', label: 'Angebotsanfragen', description: 'RFQ – Kundenanfragen nach Angeboten', icon: FileText, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/recommerce/trade-ins', label: 'Trade-In', description: 'Inzahlungnahme gebrauchter Artikel', icon: RefreshCw, roles: ['owner', 'chef', 'admin'] },
      ],
    },

    {
      title: 'Auswertungen',
      description: 'Analysen und Statistiken',
      items: [
        { href: '/admin/analytics/trends', label: 'Saisonale Trends', description: 'Verkaufstrends über die Zeit', icon: TrendingUp, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/analytics/checkout-dropoffs', label: 'Checkout-Abbrüche', description: 'Wo brechen Kunden den Kauf ab?', icon: TrendingDown, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/analytics/search-terms', label: 'Suchbegriffe', description: 'Was suchen Kunden im Shop?', icon: Search, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/analytics/health', label: 'Tracking-Integrität', description: 'Technische Datenqualität', icon: Activity, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/analytics/market-basket', label: 'Warenkorb-Analyse', description: 'Welche Produkte werden zusammen gekauft?', icon: ShoppingBag, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/analytics/ncx', label: 'NCX-Score', description: 'Kundenzufriedenheit (Stimme des Kunden)', icon: Activity, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/analytics/bestseller-ranks', label: 'Bestseller Ranks', description: 'BSR pro ASIN und Kategorie', icon: BarChart3, roles: ['owner', 'chef', 'admin'] },
        { href: '/admin/analytics/platform-choice-badges', label: 'Platform Choice Badges', description: 'Keyword → ASIN, CVR, Return-Rate', icon: Award, roles: ['owner', 'chef', 'admin'] },
      ],
    },

    {
      title: 'Einstellungen',
      description: 'Shop, Team, Rechtliches',
      items: [
        {
          label: 'Shop & Versand',
          description: 'Logo, Farben, Versanddienstleister',
          icon: Palette,
          roles: ['owner'],
          children: [
            { href: '/admin/settings', label: 'Markenauftritt & Farben', description: 'Logo, Firmenfarben, Name', icon: Palette, roles: ['owner'] },
            { href: '/admin/settings/env', label: 'Umgebung & .env', description: 'Firma, Shop-URL, Supportzeiten – wie .env.local im Dashboard anpassen', icon: Settings2, roles: ['owner'] },
            { href: '/admin/settings/shipping', label: 'Versand & Logistik', description: 'DHL, DPD, Rücksendeadresse, API', icon: Truck, roles: ['owner'] },
            { href: '/admin/settings/shop', label: 'Shop-Einstellungen', description: 'Adresse, Stornofrist, Versandoptionen', icon: Truck, roles: ['owner'] },
            { href: '/admin/settings/media', label: 'Medien & Wasserzeichen', description: 'Bildformate, Wasserzeichen', icon: Image, roles: ['owner'] },
          ],
        },
        {
          label: 'Team & Finanzen',
          description: 'Mitarbeiter, Buchhaltung – Inhaber & Stellvertreter (Chef)',
          icon: Banknote,
          roles: ['owner', 'chef'],
          children: [
            { href: '/admin/settings/finances', label: 'Finanz-Parameter', description: 'USt, Rechnungsstellung', icon: Banknote, roles: ['owner'] },
            { href: '/admin/settings/bnpl', label: 'Zahlungsanbieter (BNPL)', description: 'Mondu, Billie – API-Status', icon: CreditCard, roles: ['owner'] },
            { href: '/admin/settings/team', label: 'Team & Rollen', description: 'Berechtigungen pro Rolle', icon: UserCog, roles: ['owner'] },
            { href: '/admin/staff', label: 'Mitarbeiter', description: 'Mitarbeiter einladen, anlegen und verwalten (HR, Chef, Inhaber; Inhaber-Konto nur vom Inhaber)', icon: UserCog, roles: ['owner', 'chef', 'hr'] },
            { href: '/admin/staff/costs', label: 'Mitarbeiter-Kosten & Steuern', description: 'Kostenrechner Lohnnebenkosten, Steuern und Abgaben', icon: Calculator, roles: ['owner', 'chef'] },
            { href: '/admin/contracts', label: 'Verträge', description: 'Mitarbeiter, Verkäufer, Lieferant – Vorlagen, PDF', icon: FileText, roles: ['owner', 'chef'] },
          ],
        },
        {
          label: 'Compliance & Recht',
          description: 'Gesetze, Datenschutz, Audit',
          icon: ShieldCheck,
          roles: ['owner'],
          children: [
            { href: '/admin/compliance', label: 'Compliance-Zentrum', description: 'Übersicht Compliance-Themen', icon: ShieldCheck, roles: ['owner'] },
            { href: '/admin/legal', label: 'Rechtstexte', description: 'Impressum, Datenschutz, AGB, Widerruf im Shop anpassen', icon: FileText, roles: ['owner'] },
            { href: '/admin/datenschutz', label: 'DSGVO – Kundendaten', description: 'Datenschutz, Auskunft, Löschung', icon: ShieldCheck, roles: ['owner'] },
            { href: '/admin/audit', label: 'Prüfprotokoll', description: 'Wer hat wann was geändert? (GoBD-konform)', icon: History, roles: ['owner'] },
            { href: '/admin/compliance/recalls', label: 'Produktrückrufe', description: 'Rückruf-Kampagnen', icon: ShieldCheck, roles: ['owner'] },
            { href: '/admin/compliance/hazmat', label: 'Gefahrgut', description: 'Gefahrgut-Deklarationen', icon: ShieldCheck, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/compliance/base-pricing', label: 'PAngV Grundpreis', description: 'Grundpreis-Anzeige (€/kg)', icon: Calculator, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/epr', label: 'EPR-Registrierungen', description: 'Verpackung, Elektro', icon: ShieldCheck, roles: ['owner'] },
            { href: '/admin/ddg-reports', label: 'DDG-Meldungen', description: 'Nahrungsergänzung, Duftstoffe', icon: ShieldCheck, roles: ['owner'] },
            { href: '/admin/transparency', label: 'Transparenz', description: 'Anti-Fälschung, Produktsicherheit', icon: ShieldCheck, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/percolate-rules', label: 'Compliance-Filter', description: 'Automatische Prüfregeln', icon: ShieldCheck, roles: ['owner'] },
            { href: '/admin/compliance/geo-restrictions', label: 'Geo-Einschränkungen', description: 'Ländersperren für Produkte', icon: Globe, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/compliance/project-zero', label: 'Project Zero', description: 'Self-Service-Takedowns für Marken', icon: ShieldOff, roles: ['owner', 'chef', 'admin'] },
          ],
        },
        { href: '/admin/settings/webhooks', label: 'Webhook-Log', description: 'Eingehende Webhooks (Mollie etc.)', icon: Activity, roles: ['owner'] },
      ],
    },

    {
      title: 'Erweiterte Funktionen',
      description: 'Für Fortgeschrittene und Spezialfälle',
      items: [
        {
          label: 'Regeln & Governance',
          description: 'Provisionsregeln, Kategorie-Freigabe',
          icon: Calculator,
          roles: ['owner', 'chef', 'admin'],
          children: [
            { href: '/admin/category-gating', label: 'Kategorien-Freigabe', icon: ShieldCheck, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/commission-rules', label: 'Provisionsregeln', icon: Calculator, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/vendor-performance', label: 'Vendor-Metriken', icon: Activity, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/sfp-trials', label: 'SFP Trials', description: 'Seller-Fulfilled Prime Trials pro Vendor', icon: Truck, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/operations/map-enforcement', label: 'MAP Enforcement', icon: Tag, roles: ['owner', 'chef', 'admin'] },
          ],
        },
        {
          label: 'UX & Technik',
          description: 'Layouts, Komponenten, Experimente',
          icon: Layout,
          roles: ['owner', 'chef', 'admin'],
          children: [
            { href: '/admin/ux/homepage-layouts', label: 'Startseiten-Layouts', icon: Layout, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/ux/component-registry', label: 'Komponenten-Registry', icon: Package, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/ux/replenishment', label: 'Erneut kaufen', icon: RefreshCw, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/ux/category-facets', label: 'Category Facets', description: 'Dynamische Filter pro Kategorie', icon: SlidersHorizontal, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/ux/carts', label: 'Warenkörbe', description: 'Cross-Device Carts', icon: ShoppingCart, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/ux/navigation-hubs', label: 'Navigation Hubs', description: 'Intentions-Hubs (Bento, Editorial, Countdown)', icon: LayoutGrid, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/ux/quizzes', label: 'Guided Selling (Quizzes)', description: 'Digitaler Sommelier – Quiz mit Fragen & Antworten', icon: Lightbulb, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/ux/product-media-assets', label: 'Product Media Assets', description: 'Hochauflösende Medien pro ASIN', icon: Image, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/ux/quick-view-config', label: 'Quick View Config', description: 'Pro ASIN: Quick View oder Redirect zur PDP', icon: Eye, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/marketing/ab-experiments', label: 'A/B-Tests', icon: TrendingUp, roles: ['owner', 'chef', 'admin'] },
          ],
        },
        {
          label: 'Enterprise & B2B',
          description: 'PunchOut, Lot-Tracking, B2B-Finanzierung',
          icon: Building2,
          roles: ['owner', 'chef', 'admin'],
          children: [
            { href: '/admin/enterprise', label: 'Übersicht', icon: LayoutDashboard, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/enterprise/punchout', label: 'PunchOut (SAP, Coupa)', icon: ExternalLink, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/enterprise/inventory-lots', label: 'Chargen-Verfolgung', icon: Package, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/b2b/factoring', label: 'B2B Factoring', icon: CreditCard, roles: ['owner', 'chef', 'admin'] },
          ],
        },
        {
          label: 'Marktplatz & Medien',
          description: 'Vendors, Widgets, Retail Media',
          icon: Store,
          roles: ['owner', 'chef', 'admin'],
          children: [
            { href: '/admin/integrations/widgets', label: 'Widgets (Buy With)', icon: ExternalLink, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/retail-media/native-banners', label: 'Native Banners', icon: Layout, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/retail-media/editorials', label: 'Shoppable Editorials', icon: Image, roles: ['owner', 'chef', 'admin'] },
            { href: '/admin/vendors/csba', label: 'Kundenservice-Auslagerung', description: 'Support durch externen Anbieter verwalten', icon: HeadphonesIcon, roles: ['owner', 'chef', 'admin'] },
          ],
        },
        { href: '/admin/asin-registry', label: 'ASIN-Registry', description: 'Amazon-Produkt-IDs verwalten', icon: Package, roles: ['owner', 'chef', 'admin', 'product_care'] },
        { href: '/admin/product-guidance', label: 'Product Guidance', description: 'Produkt-Empfehlungen steuern', icon: Lightbulb, roles: ['owner', 'chef', 'admin', 'product_care'] },
        { href: '/admin/domain-events', label: 'Domain-Ereignisse', description: 'Technische Event-Logs', icon: Activity, roles: ['owner'] },
      ],
    },
  ]
  const effectiveRoles = roles.length ? roles : ['owner']

  function filterItemByRole(item: NavItem): NavItem | null {
    const hasAccess = item.roles.some((r) => effectiveRoles.includes(r))
    if (item.children) {
      const filteredChildren = item.children.map(filterItemByRole).filter(Boolean) as NavItem[]
      if (filteredChildren.length === 0 && !hasAccess) return null
      if (filteredChildren.length === 0 && hasAccess && !item.href) return null
      return { ...item, children: filteredChildren.length > 0 ? filteredChildren : undefined }
    }
    return hasAccess ? item : null
  }

  const filteredGroupsBase = navGroups
    .map((group) => ({ ...group, items: group.items.map(filterItemByRole).filter(Boolean) as NavItem[] }))
    .filter((group) => group.items.length > 0)

  const searchLower = navSearch.trim().toLowerCase()
  function searchInItem(item: NavItem): boolean {
    if (item.label.toLowerCase().includes(searchLower)) return true
    return item.children?.some(searchInItem) ?? false
  }
  function filterItemBySearch(item: NavItem): NavItem | null {
    if (!searchLower) return item
    if (item.children) {
      const filteredChildren = item.children.filter(searchInItem).map(filterItemBySearch).filter(Boolean) as NavItem[]
      if (searchInItem(item) || filteredChildren.length > 0) {
        return { ...item, children: filteredChildren.length > 0 ? filteredChildren : item.children! }
      }
      return null
    }
    return searchInItem(item) ? item : null
  }
  const filteredGroups = searchLower
    ? filteredGroupsBase
      .map((group) => ({
        ...group,
        items: group.title.toLowerCase().includes(searchLower)
          ? group.items
          : group.items.map(filterItemBySearch).filter(Boolean) as NavItem[],
      }))
      .filter((group) => group.items.length > 0)
    : filteredGroupsBase

  const activeGroupTitle = filteredGroupsBase.find((g) =>
    g.items.some((item) => itemMatchesPath(item, pathname))
  )?.title

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_NAV_SLIM)
      setSidebarSlim(raw === 'true')
    } catch {}
  }, [])

  const subItemKey = (groupTitle: string, itemLabel: string) => `${groupTitle}|${itemLabel}`

  useEffect(() => {
    if (typeof window === 'undefined' || !activeGroupTitle) return
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.add(activeGroupTitle)
      try {
        localStorage.setItem(STORAGE_NAV_OPEN, JSON.stringify([...next]))
      } catch {}
      return next
    })
  }, [activeGroupTitle])

  useEffect(() => {
    const toOpen = new Set<string>()
    navGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children?.some((c) => itemMatchesPath(c, pathname))) {
          toOpen.add(subItemKey(group.title, item.label))
        }
      })
    })
    if (toOpen.size > 0) {
      setOpenSubItems((prev) => new Set([...prev, ...toOpen]))
    }
  }, [pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_NAV_OPEN)
      const parsed = raw ? JSON.parse(raw) : []
      const fromStorage = Array.isArray(parsed) ? new Set(parsed) : new Set<string>()
      if (activeGroupTitle) fromStorage.add(activeGroupTitle)
      setOpenGroups(fromStorage)
    } catch {}
  }, [activeGroupTitle])

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      try {
        localStorage.setItem(STORAGE_NAV_OPEN, JSON.stringify([...next]))
      } catch {}
      return next
    })
  }

  const toggleSubItem = (groupTitle: string, itemLabel: string) => {
    const key = subItemKey(groupTitle, itemLabel)
    setOpenSubItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSlim = () => {
    setSidebarSlim((v) => {
      const next = !v
      try {
        localStorage.setItem(STORAGE_NAV_SLIM, String(next))
      } catch {}
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="admin-area min-h-screen bg-luxe-black flex items-center justify-center">
        <div className="text-foreground">Laden...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (unauthorized) {
    return (
      <div className="admin-area min-h-screen bg-luxe-black flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold text-white">Keine Admin-Berechtigung</h1>
          <p className="text-luxe-silver">
            Du bist als <strong className="text-white">{user.email}</strong> eingeloggt, hast aber keinen Zugang zum Admin-Bereich.
          </p>
          <p className="text-sm text-luxe-silver">
            Inhaber-Zugang: Mit <strong>{OWNER_EMAIL}</strong> anmelden. Oder dein Mitarbeiter-Eintrag wurde deaktiviert - dann in der Datenbank <code className="bg-luxe-gray px-1 rounded">staff</code> prüfen und <code className="bg-luxe-gray px-1 rounded">is_active = true</code> setzen.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="luxe" onClick={() => { setUnauthorized(false); router.refresh(); }}>Erneut prüfen</Button>
            <Button variant="admin-outline" onClick={handleLogout}>Abmelden</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`admin-area min-h-screen ${isOwner ? 'admin-theme-owner bg-luxe-black' : 'admin-theme-staff bg-luxe-black'}`}>
      {/* Admin Header */}
      <header className="bg-luxe-charcoal border-b border-luxe-gray">
        <div className="container-luxe py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin" prefetch={false} className="flex items-center space-x-3 group">
              <Logo showText={false} size="md" className="[&_img]:rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-white group-hover:text-white/90">Premium Headshop</h1>
                <p className="text-sm text-white/80">Admin-Panel</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                prefetch={false}
                className="relative p-2 rounded-lg text-luxe-silver hover:text-foreground hover:bg-luxe-gray/50 transition-colors"
                title="Wichtige Hinweise anzeigen"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-amber-500 text-luxe-black text-xs font-bold">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </Link>
              <div className="text-right hidden sm:block">
                <p className="text-sm text-white font-medium">{user?.email}</p>
                <p className="text-xs font-medium text-white/90">
                  {roles.length > 1 ? 'Mehrere Rollen' : roles[0] === 'owner' ? 'Inhaber' : roles[0] === 'chef' ? 'Chef' : roles[0] === 'admin' ? 'Admin' : roles[0] === 'product_care' ? 'Produktpflege' : roles[0] === 'support' ? 'Kundenservice' : roles[0] === 'employee' ? 'Mitarbeiter' : roles[0] === 'hr' ? 'Personal' : roles[0] === 'team_leader' ? 'Teamleiter' : roles[0] === 'warehouse_lead' ? 'Lagerleitung' : roles[0] === 'marketing' ? 'Marketing' : roles[0] || 'Admin'}
                </p>
              </div>
              <Button
                onClick={handleLogout}
                variant="admin-outline"
                className="text-luxe-gold"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar: sticky, Menü-Inhalt eigenständig scrollbar (nicht ganze Seite) */}
        <aside
          className={`sticky top-0 self-start h-screen flex flex-col shrink-0 border-r border-luxe-gray bg-luxe-charcoal/95 transition-[width] duration-200 overflow-hidden ${
            sidebarSlim ? 'w-[4.5rem]' : 'w-64'
          }`}
        >
          <div className="flex flex-col h-full min-h-0 overflow-y-auto overflow-x-hidden">
            {!sidebarSlim && (
              <div className="p-2 pb-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-luxe-silver/70" />
                  <input
                    type="search"
                    placeholder="Menü durchsuchen..."
                    value={navSearch}
                    onChange={(e) => setNavSearch(e.target.value)}
                    className="w-full rounded-md bg-luxe-black/50 border border-luxe-gray py-2 pl-8 pr-3 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-luxe-gold/50"
                  />
                </div>
              </div>
            )}
            <nav className="py-4 px-2 space-y-1">
              {filteredGroups.map((group) => {
                const isOpen = openGroups.has(group.title) || group.items.length === 1
                const isSingle = group.items.length === 1

                return (
                  <div key={group.title} className="rounded-lg bg-luxe-black/40">
                    {isSingle ? (
                      <div className="px-2 py-1">
                        {group.items.filter((item): item is typeof item & { href: string } => !!item.href).map((item) => {
                          const Icon = item.icon
                          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              prefetch={false}
                              title={sidebarSlim ? item.label : (item.description ?? item.label)}
                              className={`
                                group flex items-center gap-3 rounded-md py-2.5 text-sm transition-all duration-200 ease-out
                                ${sidebarSlim ? 'justify-center px-0' : 'px-3'}
                                ${isActive
                                  ? 'nav-link-active bg-emerald-100 text-emerald-800 font-medium'
                                  : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-l-2 hover:border-l-emerald-500 hover:pl-[10px] border-l-2 border-l-transparent'
                                }
                              `}
                            >
                              <span className={`flex shrink-0 items-center justify-center rounded-md transition-all duration-200 ${sidebarSlim ? 'w-9 h-9' : 'w-8 h-8'} ${isActive ? 'nav-link-active bg-emerald-100 text-emerald-800' : 'bg-luxe-gray/40 group-hover:bg-emerald-50'}`}>
                                <Icon className="w-4 h-4" />
                              </span>
                              {!sidebarSlim && <span className="truncate">{item.label}</span>}
                            </Link>
                          )
                        })}
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.title)}
                          className={`
                            flex w-full items-center gap-3 rounded-md py-2.5 text-left text-sm font-medium transition-all duration-200 ease-out
                            ${sidebarSlim ? 'justify-center px-0' : 'px-3'}
                            text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-l-2 hover:border-l-emerald-500 hover:pl-[10px] border-l-2 border-l-transparent
                          `}
                          title={sidebarSlim ? group.title : (group.description ?? group.title)}
                        >
                          {!sidebarSlim && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-600">
                              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </span>
                          )}
                          <span className={`flex shrink-0 items-center justify-center rounded-md ${sidebarSlim ? 'w-9 h-9' : 'w-8 h-8'} bg-luxe-gray/40`}>
                            {(() => {
                              const GroupIcon = group.items[0]?.icon ?? Package
                              return <GroupIcon className="w-4 h-4" />
                            })()}
                          </span>
                          {!sidebarSlim && (
                            <span className="flex flex-col items-start min-w-0">
                              <span className="truncate w-full">{group.title}</span>
                              {group.description && (
                                <span className="text-[10px] text-slate-500 truncate w-full max-w-[180px]" title={group.description}>
                                  {group.description}
                                </span>
                              )}
                            </span>
                          )}
                        </button>
                        {isOpen && (
                          <ul className={`space-y-0.5 pb-2 ${sidebarSlim ? 'flex flex-col items-center' : 'pl-2 pr-1'}`}>
                            {group.items.map((item) => {
                              const Icon = item.icon
                              const hasChildren = item.children && item.children.length > 0
                              const subOpen = hasChildren && openSubItems.has(subItemKey(group.title, item.label))

                              if (hasChildren) {
                                return (
                                  <li key={item.label} className={sidebarSlim ? 'w-full flex flex-col items-center' : ''}>
                                    <button
                                      type="button"
                                      onClick={() => toggleSubItem(group.title, item.label)}
                                      title={sidebarSlim ? item.label : (item.description ?? item.label)}
                                      className={`
                                        w-full group flex items-center rounded-md text-sm transition-all duration-200 ease-out
                                        ${sidebarSlim ? 'justify-center w-9 h-9' : 'gap-3 py-2 px-3'}
                                        text-slate-700 hover:bg-emerald-50 hover:text-emerald-700
                                      `}
                                    >
                                      {!sidebarSlim && (
                                        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-600">
                                          {subOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </span>
                                      )}
                                      <Icon className="h-4 w-4 shrink-0 opacity-70" />
                                      {!sidebarSlim && <span className="truncate">{item.label}</span>}
                                    </button>
                                    {subOpen && item.children && (
                                      <ul className={`mt-0.5 space-y-0.5 ${sidebarSlim ? 'flex flex-col items-center' : 'pl-6 border-l border-luxe-gray/50 ml-2'}`}>
                                        {item.children.map((child) => {
                                          const ChildIcon = child.icon
                                          const isChildActive = child.href && (pathname === child.href || (child.href !== '/admin' && pathname.startsWith(child.href)))
                                          return (
                                            <li key={child.href} className={sidebarSlim ? 'w-full flex justify-center' : ''}>
                                              <Link
                                                href={child.href!}
                                                prefetch={false}
                                                title={child.description ?? child.label}
                                                className={`
                                                  flex items-center rounded-md text-sm transition-all duration-200 ease-out
                                                  ${sidebarSlim ? 'justify-center w-9 h-9' : 'gap-2 py-1.5 px-2'}
                                                  ${isChildActive
                                                    ? 'nav-link-active bg-amber-600/25 text-amber-300 font-medium'
                                                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                                  }
                                                `}
                                              >
                                                <ChildIcon className={`h-3.5 w-3.5 shrink-0 ${isChildActive ? 'opacity-100' : 'opacity-60'}`} />
                                                {!sidebarSlim && <span className="truncate text-xs">{child.label}</span>}
                                              </Link>
                                            </li>
                                          )
                                        })}
                                      </ul>
                                    )}
                                  </li>
                                )
                              }

                              const isActive = item.href && (pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)))
                              return (
                                <li key={item.href || item.label} className={sidebarSlim ? 'w-full flex justify-center' : ''}>
                                  <Link
                                    href={item.href!}
                                    prefetch={false}
                                    title={item.description ?? item.label}
                                    className={`
                                      group flex items-center rounded-md text-sm transition-all duration-200 ease-out
                                      ${sidebarSlim ? 'justify-center w-9 h-9' : 'gap-3 py-2 px-3'}
                                      ${isActive
                                        ? 'nav-link-active bg-amber-600/25 text-amber-300 font-medium'
                                        : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-l-2 hover:border-l-emerald-500 hover:pl-[10px] border-l-2 border-l-transparent'
                                      }
                                    `}
                                  >
                                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                                    {!sidebarSlim && <span className="truncate">{item.label}</span>}
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </nav>
            <div className="mt-auto border-t border-luxe-gray/60 p-2">
              <button
                type="button"
                onClick={toggleSlim}
                className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-luxe-silver transition-all duration-200 ease-out hover:bg-emerald-50 hover:text-emerald-700"
                title={sidebarSlim ? 'Seitenleiste ausklappen' : 'Seitenleiste einklappen'}
              >
                {sidebarSlim ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                {!sidebarSlim && <span className="text-xs">Schmal</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-luxe-black">
          <AdminBreadcrumbs />
          {children}
        </main>
      </div>
    </div>
  )
}
