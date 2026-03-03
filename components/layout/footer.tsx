'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Instagram, Mail, Phone, Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo'
import { TrustSignals } from '@/components/trust-signals'
import { ComplianceTrustBadge } from '@/components/compliance-trust-badge'
import { CookieSettingsLink } from '@/components/cookie-settings-link'
import type { CompanyInfo } from '@/lib/company'

function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    setDone(null)
    try {
      const res = await fetch('/api/newsletter/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'footer' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Fehler bei der Anmeldung.')
        return
      }
      setDone(data.message || 'Vielen Dank!')
      setEmail('')
    } catch {
      setError('Anmeldung fehlgeschlagen. Bitte später erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-500 mb-3">Newsletter</p>
      {done ? (
        <p className="text-chill-green text-sm font-medium">{done}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ihre E-Mail-Adresse"
            required
            className="w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-chill-green focus:outline-none focus:ring-1 focus:ring-chill-green/30 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-chill-green px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-chill-green-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Anmelden'}
          </button>
        </form>
      )}
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  )
}

interface FooterProps {
  company?: CompanyInfo
  supportHours?: string
}

export function Footer({ company, supportHours: supportHoursProp }: FooterProps = {}) {
  const address = company ? `${company.address}, ${company.postalCode} ${company.city}` : 'Musterstraße 123, 12345 Berlin'
  const phone = company?.phone ?? '+49 (0) 123 456789'
  const email = company?.email ?? 'kontakt@mein-headshop.de'
  const supportHours = supportHoursProp ?? 'Mo–Fr 10–18 Uhr'
  const footerLinks = {
    shop: [
      { label: 'Alle Produkte', href: '/shop' },
      { label: 'Bongs', href: '/shop' },
      { label: 'Grinder', href: '/shop' },
      { label: 'Papers', href: '/shop' },
      { label: 'Vaporizer', href: '/shop' },
    ],
    service: [
      { label: 'Über uns', href: '/about' },
      { label: 'Kontakt', href: '/contact' },
      { label: 'A–Z Käuferschutz', href: '/a-z-garantie' },
      { label: 'Versand & Lieferung', href: '/shipping' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Trade-In', href: '/trade-in' },
      { label: 'Influencer', href: '/influencer' },
      { label: 'Bewertungen', href: '/bewertungen' },
    ],
    legal: [
      { label: 'Impressum', href: '/impressum' },
      { label: 'Datenschutz', href: '/privacy' },
      { label: 'AGB', href: '/terms' },
      { label: 'Widerrufsrecht', href: '/returns' },
      { label: 'Gewährleistung', href: '/returns#gewaehrleistung' },
      { label: 'Compliance', href: '/compliance' },
      { label: 'Illegale Inhalte melden', href: '/illegale-inhalte-melden' },
    ],
  }

  const LinkColumn = ({ title, links }: { title: string; links: { label: string; href: string }[] }) => (
    <div>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 mb-5">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-neutral-700 hover:text-chill-green transition-colors duration-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <footer className="relative bg-white border-t border-neutral-200 text-neutral-800 overflow-hidden">
      <div className="bg-neutral-50/80 border-b border-neutral-100">
        <TrustSignals />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 lg:py-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Brand + Newsletter */}
          <div className="lg:col-span-5 space-y-8">
            <Link href="/" className="inline-block">
              <Logo showText={true} size="md" className="text-[#1a2e1a]" />
            </Link>
            <p className="text-sm text-neutral-600 leading-relaxed max-w-xs">
              Premium Zubehör, handverlesen und diskret. Von Kennern für Genießer.
            </p>
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center border border-neutral-200 text-neutral-600 hover:border-chill-green hover:text-chill-green hover:bg-chill-green/5 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${email}`}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-neutral-200 text-neutral-600 hover:border-chill-green hover:text-chill-green hover:bg-chill-green/5 transition-colors"
                aria-label="E-Mail"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
            <NewsletterSignup />
          </div>

          {/* Links */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-12">
            <LinkColumn title="Shop" links={footerLinks.shop} />
            <LinkColumn title="Service" links={footerLinks.service} />
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 mb-5">Kontakt</h3>
              <ul className="space-y-3.5 text-sm text-neutral-700">
                <li className="leading-relaxed">{address}</li>
                <li>
                  <a href={`tel:${encodeURIComponent(phone)}`} className="hover:text-chill-green transition-colors inline-flex items-center gap-2">
                    <Phone className="w-4 h-4 text-neutral-500" />
                    {phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${email}`} className="hover:text-chill-green transition-colors inline-flex items-center gap-2">
                    <Mail className="w-4 h-4 text-neutral-500" />
                    {email}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-200 py-8">
          {new Date() >= new Date('2026-06-19') && (
            <div className="flex justify-center mb-6">
              <Link
                href="/returns"
                className="text-xs text-neutral-500 hover:text-chill-green transition-colors underline underline-offset-2"
                aria-label="Widerrufsrecht ausüben"
              >
                Widerruf ausüben
              </Link>
            </div>
          )}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <nav className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-500">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-chill-green transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/privacy#cookies" className="hover:text-chill-green transition-colors">
                Cookies
              </Link>
              <CookieSettingsLink className="hover:text-chill-green transition-colors text-xs cursor-pointer bg-transparent border-0">
                Cookie-Einstellungen
              </CookieSettingsLink>
            </nav>
            <p className="text-xs text-neutral-500">
              © {new Date().getFullYear()} · Preise inkl. USt., zzgl. Versand · 14 Tage Widerrufsrecht · Support {supportHours}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 mt-8 pt-8 border-t border-neutral-100">
            <ComplianceTrustBadge />
            <p className="text-[11px] text-neutral-500 text-center sm:text-left">
              <span aria-hidden>🔞</span> Nur für Personen ab 18 Jahren.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
