'use client'

import Link from 'next/link'
import { ArrowLeft, Store, Users, BarChart3, FileCheck, Mail, Package, Shield, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-luxe-black">
      <div className="relative bg-gradient-to-b from-luxe-charcoal to-luxe-black py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(212,175,55,0.08)_0%,transparent_50%)]" />
        <div className="container-luxe relative z-10 px-4">
          <Link href="/" className="inline-flex items-center text-luxe-silver hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Link>
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">Partner werden</h1>
            <p className="text-luxe-silver text-lg mt-4">
              Verkaufe deine Produkte über unseren Shop – strukturiert, übersichtlich und professionell.
            </p>
          </div>
        </div>
      </div>

      <div className="container-luxe py-12 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Für wen */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-luxe-gold" />
              Für wen ist das geeignet?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-luxe-charcoal border border-luxe-gray">
                <h3 className="text-white font-medium mb-2">Influencer & Content Creator</h3>
                <p className="text-luxe-silver text-sm">
                  Du hast eine eigene Produktlinie oder Kooperationen? Wir übernehmen Lager, Versand und Zahlung – du bekommst deinen vereinbarten Anteil.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-luxe-charcoal border border-luxe-gray">
                <h3 className="text-white font-medium mb-2">Händler & Marken</h3>
                <p className="text-luxe-silver text-sm">
                  Du möchtest deine Ware über unseren Shop anbieten? Pro Verkauf erhältst du deinen Anteil – wir kümmern uns um den Rest.
                </p>
              </div>
            </div>
          </section>

          {/* Ablauf */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-luxe-gold" />
              So funktioniert es
            </h2>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex shrink-0 w-10 h-10 rounded-full bg-luxe-gold/20 text-luxe-gold font-bold flex items-center justify-center">1</span>
                <div>
                  <h3 className="text-white font-medium">Anfrage stellen</h3>
                  <p className="text-luxe-silver text-sm">Schick uns eine E-Mail mit deiner Idee – was möchtest du verkaufen, welche Konditionen stellst du dir vor?</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex shrink-0 w-10 h-10 rounded-full bg-luxe-gold/20 text-luxe-gold font-bold flex items-center justify-center">2</span>
                <div>
                  <h3 className="text-white font-medium">Gespräch & Vertrag</h3>
                  <p className="text-luxe-silver text-sm">Wir besprechen Details, Konditionen und Prozesse. Alles wird schriftlich festgehalten.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex shrink-0 w-10 h-10 rounded-full bg-luxe-gold/20 text-luxe-gold font-bold flex items-center justify-center">3</span>
                <div>
                  <h3 className="text-white font-medium">Produkte einpflegen</h3>
                  <p className="text-luxe-silver text-sm">Wir legen deine Produkte im Shop an – du gibst die Infos, wir übernehmen das Management.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex shrink-0 w-10 h-10 rounded-full bg-luxe-gold/20 text-luxe-gold font-bold flex items-center justify-center">4</span>
                <div>
                  <h3 className="text-white font-medium">Verkauf & Abrechnung</h3>
                  <p className="text-luxe-silver text-sm">Bei jedem Verkauf wird dein Anteil berechnet. Regelmäßige Abrechnungen und Auszahlungen.</p>
                </div>
              </li>
            </ol>
          </section>

          {/* Was wir übernehmen */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Package className="w-6 h-6 text-luxe-gold" />
              Was wir übernehmen
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-luxe-charcoal border border-luxe-gray/50 flex items-start gap-3">
                <Store className="w-5 h-5 text-luxe-gold shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium text-sm">Shop & Präsentation</h3>
                  <p className="text-luxe-silver text-xs mt-1">Produkte professionell darstellen, Kategorien, Filter</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-luxe-charcoal border border-luxe-gray/50 flex items-start gap-3">
                <Truck className="w-5 h-5 text-luxe-gold shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium text-sm">Versand & Logistik</h3>
                  <p className="text-luxe-silver text-xs mt-1">Bestellungen abwickeln, Versand, Tracking</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-luxe-charcoal border border-luxe-gray/50 flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-luxe-gold shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium text-sm">Abrechnung & Auszahlung</h3>
                  <p className="text-luxe-silver text-xs mt-1">Transparente Aufstellung, pünktliche Zahlung</p>
                </div>
              </div>
            </div>
          </section>

          {/* Sicherheit */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <Shield className="w-6 h-6 text-luxe-gold" />
              Strukturiert & seriös
            </h2>
            <p className="text-luxe-silver text-sm leading-relaxed">
              Alle Verträge und Konditionen werden schriftlich festgehalten. Abrechnungen erfolgen nachvollziehbar. 
              Bei Fragen stehen wir persönlich zur Verfügung – alles sauber und übersichtlich.
            </p>
          </section>

          {/* CTA */}
          <section className="pt-8">
            <div className="p-8 rounded-2xl bg-luxe-charcoal border border-luxe-gray text-center">
              <Mail className="w-12 h-12 text-luxe-gold mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Interesse?</h2>
              <p className="text-luxe-silver text-sm mb-6 max-w-md mx-auto">
                Schreib uns eine E-Mail mit deiner Idee. Wir melden uns schnellstmöglich bei dir.
              </p>
              <Link href="/partner/anfrage">
                <Button variant="luxe" size="lg">
                  Jetzt anfragen
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
