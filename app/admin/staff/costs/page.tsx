'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Calculator,
  ArrowLeft,
  Euro,
  Info,
  FileText,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Beitragssätze Stand 2025 (Arbeitgeberanteil) – bitte jährlich prüfen
const RATES = {
  rentenversicherung: 0.093,
  arbeitslosenversicherung: 0.013,
  krankenversicherung: 0.073,
  pflegeversicherung: 0.018,
  // Umlagen (Richtwerte, abhängig von Branche/Betrieb)
  u1_lohnfortzahlung: 0.008,
  u2_mutterschutz: 0.0025,
  u3_insolvenzgeld: 0.0006,
  insolvenzgeld_beitrag: 0.0006,
} as const

const MINIJOB_GRENZE = 538.33 // 2025: 538,33 € (520 € + Pauschalen)

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-luxe-gray rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-luxe-charcoal hover:bg-luxe-gray/30 text-left text-white font-medium"
      >
        {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        {title}
      </button>
      {open && <div className="px-4 py-3 border-t border-luxe-gray bg-luxe-black/30 text-luxe-silver text-sm space-y-2">{children}</div>}
    </div>
  )
}

export default function StaffCostsPage() {
  const [brutto, setBrutto] = useState('3000')
  const [isMinijob, setIsMinijob] = useState(false)
  const [includeUmlagen, setIncludeUmlagen] = useState(true)

  const bruttoNum = parseFloat(brutto.replace(',', '.')) || 0
  const isMinijobMode = isMinijob || bruttoNum > 0 && bruttoNum <= MINIJOB_GRENZE

  let totalAg = 0
  let breakdown: { label: string; value: number }[] = []

  if (bruttoNum > 0) {
    if (isMinijobMode && bruttoNum <= MINIJOB_GRENZE) {
      const pauschaleKV = bruttoNum * 0.13
      const pauschaleRV = bruttoNum * 0.15
      const pauschaleLohnsteuer = bruttoNum * 0.02
      const u1 = bruttoNum * 0.011
      const u2 = bruttoNum * 0.0022
      const insolvenz = bruttoNum * 0.0015
      totalAg = bruttoNum + pauschaleKV + pauschaleRV + pauschaleLohnsteuer + u1 + u2 + insolvenz
      breakdown = [
        { label: 'Bruttolohn (Minijob)', value: bruttoNum },
        { label: 'Pauschale Krankenversicherung (13 %)', value: pauschaleKV },
        { label: 'Pauschale Rentenversicherung (15 %)', value: pauschaleRV },
        { label: 'Pauschale Lohnsteuer (2 %)', value: pauschaleLohnsteuer },
        { label: 'U1 Umlage (1,1 %)', value: u1 },
        { label: 'U2 Umlage (0,22 %)', value: u2 },
        { label: 'Insolvenzgeldumlage (0,15 %)', value: insolvenz },
      ]
    } else {
      const rv = Math.min(bruttoNum * RATES.rentenversicherung, 755.25)
      const alv = Math.min(bruttoNum * RATES.arbeitslosenversicherung, 105.75)
      const kv = bruttoNum * RATES.krankenversicherung
      const pv = bruttoNum * RATES.pflegeversicherung
      const agSozial = rv + alv + kv + pv
      breakdown = [
        { label: 'Bruttolohn', value: bruttoNum },
        { label: 'Rentenversicherung (9,3 % AG-Anteil)', value: rv },
        { label: 'Arbeitslosenversicherung (1,3 % AG-Anteil)', value: alv },
        { label: 'Krankenversicherung (7,3 % AG-Anteil)', value: kv },
        { label: 'Pflegeversicherung (1,8 % AG-Anteil)', value: pv },
      ]
      totalAg = bruttoNum + agSozial
      if (includeUmlagen) {
        const u1 = bruttoNum * RATES.u1_lohnfortzahlung
        const u2 = bruttoNum * RATES.u2_mutterschutz
        const u3 = bruttoNum * (RATES.u3_insolvenzgeld + RATES.insolvenzgeld_beitrag)
        breakdown.push(
          { label: 'U1 Umlage (Lohnfortzahlung im Krankheitsfall)', value: u1 },
          { label: 'U2 Umlage (Mutterschutz)', value: u2 },
          { label: 'U3 / Insolvenzgeld-Umlage', value: u3 }
        )
        totalAg += u1 + u2 + u3
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="text-luxe-silver" asChild>
          <Link href="/admin/staff">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Zurück zu Mitarbeiter
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calculator className="w-7 h-7 text-luxe-gold" />
          Mitarbeiter-Kosten & Steuern
        </h1>
        <p className="text-luxe-silver mt-1">
          Kostenrechner für Lohnnebenkosten und Übersicht: Was Sie für Lohnsteuer und Sozialversicherung brauchen, wo Sie es beantragen und was Sie zahlen müssen.
        </p>
      </div>

      {/* ——— Kostenrechner ——— */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Euro className="w-5 h-5 text-luxe-gold" />
            Kostenrechner: Was kostet mich ein Mitarbeiter?
          </CardTitle>
          <p className="text-sm text-luxe-silver font-normal">
            Bruttolohn eingeben – Sie sehen die Arbeitgeberanteile (Sozialversicherung) und optional Umlagen. Lohnsteuer trägt der Arbeitnehmer; sie wird von Ihnen einbehalten und abgeführt.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brutto" className="text-luxe-silver">Monatsbruttolohn (€)</Label>
              <Input
                id="brutto"
                type="text"
                inputMode="decimal"
                value={brutto}
                onChange={(e) => setBrutto(e.target.value.replace(/[^0-9,.]/g, ''))}
                className="mt-1 bg-luxe-black border-luxe-gray text-white"
                placeholder="z. B. 3000"
              />
            </div>
            <div className="flex flex-col gap-2 pt-6">
              <label className="flex items-center gap-2 text-luxe-silver cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMinijob}
                  onChange={(e) => setIsMinijob(e.target.checked)}
                  className="rounded border-luxe-gray bg-luxe-black text-luxe-gold"
                />
                Minijob (bis 538,33 €/Monat 2025)
              </label>
              <label className="flex items-center gap-2 text-luxe-silver cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeUmlagen}
                  onChange={(e) => setIncludeUmlagen(e.target.checked)}
                  className="rounded border-luxe-gray bg-luxe-black text-luxe-gold"
                />
                Umlagen (U1, U2, U3) einrechnen
              </label>
            </div>
          </div>
          {bruttoNum > 0 && (
            <div className="rounded-lg bg-luxe-black border border-luxe-gray p-4 space-y-2">
              {breakdown.map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-luxe-silver">{row.label}</span>
                  <span className="text-white font-medium">{row.value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>
              ))}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-luxe-gray mt-2">
                <span className="text-white">Gesamtkosten pro Monat (Arbeitgeber)</span>
                <span className="text-luxe-gold">{totalAg.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
              </div>
            </div>
          )}
          <div className="rounded-lg bg-luxe-gold/10 border border-luxe-gold/30 p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-luxe-gold flex-shrink-0 mt-0.5" />
            <p className="text-sm text-luxe-silver">
              Beitragssätze und Bemessungsgrenzen gelten für 2025 (Deutschland). Minijob-Grenze und Pauschalen können sich jährlich ändern. Prüfen Sie die aktuellen Werte bei Ihrem Steuerberater oder bei der Minijob-Zentrale / Deutsche Rentenversicherung.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ——— Anleitung Steuern & Abgaben ——— */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-luxe-gold" />
            Steuern & Abgaben: Was Sie brauchen, wo Sie es finden, was Sie zahlen müssen
          </CardTitle>
          <p className="text-sm text-luxe-silver font-normal">
            Kurzüberblick für Arbeitgeber in Deutschland (ohne Rechtsberatung – bei Unsicherheit Steuerberater oder Lohnsteuerhilfe fragen).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Section title="1. Was Sie als Arbeitgeber brauchen (Erstbeschäftigung)" defaultOpen>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Steuernummer</strong> (für Ihr Unternehmen) – haben Sie als Gewerbetreibender bereits vom Finanzamt.</li>
              <li><strong className="text-white">Betriebsnummer</strong> – erhalten Sie von der Deutschen Rentenversicherung, sobald Sie den ersten Arbeitnehmer anmelden (siehe „Wo beantragen“).</li>
              <li><strong className="text-white">Bankkonto</strong> für Lastschriften (Lohnsteuer, SV-Beiträge).</li>
              <li><strong className="text-white">ELSTER-Zugang</strong> – für elektronische Lohnsteueranmeldung (siehe unten).</li>
              <li>Vom <strong className="text-white">Mitarbeiter</strong>: Steuer-ID, ggf. Sozialversicherungsausweis, Angaben zur Krankenkasse, Freibeträge (Steuerklasse, Kinderfreibeträge etc.).</li>
            </ul>
          </Section>
          <Section title="2. Wo Sie was finden und beantragen">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">ELSTER</strong> (Lohnsteuer, Anmeldung, Jahresmeldeverfahren): <a href="https://www.elster.de" target="_blank" rel="noopener noreferrer" className="text-luxe-gold hover:underline">www.elster.de</a> – Registrierung mit Steuernummer, dann Anmeldungen und Lohnsteuer-Anmeldung (monatlich/vorläufig).</li>
              <li><strong className="text-white">Betriebsnummer / Rentenversicherung</strong>: Anmeldung bei der <strong>Deutschen Rentenversicherung</strong> (für Ihr Bundesland zuständige Einrichtung, z. B. DRV Bund). Dort melden Sie Beschäftigte (Erstmeldung, Änderungen, Abmeldung) und erhalten die Betriebsnummer. Online möglich.</li>
              <li><strong className="text-white">Minijob-Zentrale</strong> (bei Beschäftigung bis 538,33 €/Monat 2025): <a href="https://www.minijob-zentrale.de" target="_blank" rel="noopener noreferrer" className="text-luxe-gold hover:underline">www.minijob-zentrale.de</a> – Anmeldung der geringfügigen Beschäftigung, Pauschalabgaben.</li>
              <li><strong className="text-white">Krankenkasse des Arbeitnehmers</strong>: Sobald Sie die Betriebsnummer haben, melden Sie den Arbeitnehmer bei der für ihn zuständigen Krankenkasse (oder über die Rentenversicherung mit). Beiträge laufen über die <strong>Zahlstelle</strong> (oft die Krankenkasse des Arbeitnehmers oder eine gemeinsame Stelle).</li>
              <li><strong className="text-white">Finanzamt</strong>: Lohnsteuer-Anmeldung (monatlich oder vierteljährlich je nach Größe) und jährliche Lohnsteuer-Bescheinigung (LSt 1) – alles über ELSTER.</li>
            </ul>
          </Section>
          <Section title="3. Was Sie abführen müssen (Zahlungen)">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Lohnsteuer + Solidaritätszuschlag + ggf. Kirchensteuer</strong>: Sie behalten sie vom Bruttolohn ein und führen sie ans Finanzamt ab (Frist: in der Regel bis zum 10. des Folgemonats über ELSTER).</li>
              <li><strong className="text-white">Sozialversicherung (Renten-, Arbeitslosen-, Kranken-, Pflegeversicherung)</strong>: Arbeitgeber- und Arbeitnehmeranteil werden von Ihnen einbehalten bzw. getragen und an die Einzugsstelle (z. B. Deutsche Rentenversicherung, Krankenkasse) gezahlt. Fristen und Zahlstellen hängen von der Meldung ab (oft monatlich, Frist z. B. bis zum 15. oder zum Monatsende).</li>
              <li><strong className="text-white">Umlagen</strong> (U1 Lohnfortzahlung, U2 Mutterschutz, U3 Insolvenzgeld): Werden von der zuständigen Umlagestelle (z. B. U1 bei den Krankenkassen) berechnet und von Ihnen gezahlt.</li>
              <li><strong className="text-white">Minijob</strong>: Pauschalabgaben (Krankenversicherung, Rentenversicherung) zahlen Sie an die Minijob-Zentrale; Lohnsteuer nur, wenn der Minijobber einen Antrag auf pauschale Besteuerung stellt (ansonsten Veranlagung).</li>
            </ul>
          </Section>
          <Section title="4. Fristen (Beispiele – bitte für Ihr Bundesland prüfen)">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Lohnsteuer-Anmeldung</strong>: Monats- oder Quartalsanmeldung bis zum 10. des Folgemonats (ELSTER).</li>
              <li><strong className="text-white">Sozialversicherungsmeldungen</strong>: Erstmeldung vor Beginn der Beschäftigung bzw. unverzüglich; laufende Meldungen je nach Einzugsstelle (oft bis zum 15. oder Monatsende).</li>
              <li><strong className="text-white">Lohnabrechnung</strong>: Dem Arbeitnehmer müssen Sie spätestens mit der Lohnzahlung eine Abrechnung aushändigen.</li>
            </ul>
          </Section>
          <Section title="5. Minijob vs. sozialversicherungspflichtige Beschäftigung">
            <p className="mb-2">
              <strong className="text-white">Minijob (geringfügig entlohnt)</strong>: Bis 538,33 €/Monat (2025). Sie melden bei der Minijob-Zentrale, zahlen Pauschalen (KV, RV). Keine volle Sozialversicherungspflicht. Obergrenze und Pauschalen ändern sich jährlich.
            </p>
            <p>
              <strong className="text-white">Sozialversicherungspflichtig</strong>: Darüber oder bei mehr als 70 Tage/3 Monate kurzfristiger Beschäftigung. Volle Meldung bei Rentenversicherung und Krankenkasse, Lohnsteuer über ELSTER. Der Kostenrechner oben zeigt die Arbeitgeberanteile.
            </p>
          </Section>
          <div className="rounded-lg bg-luxe-black border border-luxe-gray p-3 flex items-start gap-2 mt-4">
            <Info className="w-5 h-5 text-luxe-gold flex-shrink-0 mt-0.5" />
            <p className="text-sm text-luxe-silver">
              Dies ist eine vereinfachte Übersicht. Gesetze und Fristen können sich ändern. Bei konkreten Fällen (z. B. Werkstudenten, kurzfristige Beschäftigung, mehrere Jobs) empfehlen wir einen Steuerberater oder die Lohnbuchhaltung.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
