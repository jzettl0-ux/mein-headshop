import Link from 'next/link'
import { Instagram, Mail, MapPin, Phone } from 'lucide-react'

export function Footer() {
  const footerLinks = {
    shop: [
      { label: 'Alle Produkte', href: '/shop' },
      { label: 'Bongs', href: '/shop' },
      { label: 'Grinder', href: '/shop' },
      { label: 'Papers', href: '/shop' },
      { label: 'Vaporizer', href: '/shop' },
    ],
    info: [
      { label: 'Über Uns', href: '/about' },
      { label: 'Influencer', href: '/influencer' },
      { label: 'Versand & Lieferung', href: '/shipping' },
      { label: 'Zahlungsmethoden', href: '/payment' },
      { label: 'FAQ', href: '/faq' },
    ],
    legal: [
      { label: 'Impressum', href: '/impressum' },
      { label: 'Datenschutz', href: '/privacy' },
      { label: 'AGB', href: '/terms' },
      { label: 'Widerrufsrecht', href: '/returns' },
    ],
  }

  return (
    <footer className="bg-luxe-charcoal border-t border-luxe-gray">
      <div className="container-luxe py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-luxe-gold to-luxe-neon rounded-lg flex items-center justify-center">
                <span className="text-luxe-black font-bold text-xl">M</span>
              </div>
              <span className="text-xl font-bold text-white">
                Premium Headshop
              </span>
            </div>
            <p className="text-luxe-silver text-sm leading-relaxed">
              Premium Cannabis Zubehör von Influencern für Connoisseurs. 
              Hochwertig, diskret, zuverlässig.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-10 h-10 bg-luxe-gray hover:bg-luxe-gold transition-colors rounded-lg items-center justify-center group"
              >
                <Instagram className="w-5 h-5 text-luxe-silver group-hover:text-luxe-black" />
              </a>
              <a
                href="mailto:kontakt@mein-headshop.de"
                className="inline-flex w-10 h-10 bg-luxe-gray hover:bg-luxe-gold transition-colors rounded-lg items-center justify-center group"
              >
                <Mail className="w-5 h-5 text-luxe-silver group-hover:text-luxe-black" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-luxe-silver hover:text-luxe-gold transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Informationen</h3>
            <ul className="space-y-2">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-luxe-silver hover:text-luxe-gold transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kontakt</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-luxe-gold mt-0.5 flex-shrink-0" />
                <span className="text-luxe-silver text-sm">
                  Musterstraße 123<br />
                  12345 Berlin
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-luxe-gold flex-shrink-0" />
                <span className="text-luxe-silver text-sm">
                  +49 (0) 123 456789
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-luxe-gold flex-shrink-0" />
                <span className="text-luxe-silver text-sm">
                  kontakt@mein-headshop.de
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-luxe-gray pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-4">
              {footerLinks.legal.map((link, index) => (
                <span key={link.href} className="flex items-center">
                  <Link
                    href={link.href}
                    className="text-luxe-silver hover:text-luxe-gold transition-colors text-xs"
                  >
                    {link.label}
                  </Link>
                  {index < footerLinks.legal.length - 1 && (
                    <span className="text-luxe-gray mx-2">•</span>
                  )}
                </span>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-luxe-silver/60 text-xs">
              © {new Date().getFullYear()} Premium Headshop. Alle Rechte vorbehalten.
            </p>
          </div>

          {/* Age Notice */}
          <div className="mt-6 text-center">
            <p className="text-luxe-silver/60 text-xs">
              🔞 Dieser Shop richtet sich ausschließlich an Personen über 18 Jahre.
              <br />
              Der Verkauf an Minderjährige ist gesetzlich verboten.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
