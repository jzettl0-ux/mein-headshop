import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, FileDown } from 'lucide-react'
import { WiderrufFormular } from '@/components/widerruf-formular'
import { getCompanyInfoAsync } from '@/lib/company'
import { getLegalContent } from '@/lib/legal-content'
import { LegalContentRender } from '@/components/legal-content-render'

export default async function ReturnsPage() {
  const legal = await getLegalContent('returns')
  if (legal?.content) {
    return (
      <div className="min-h-screen bg-luxe-black py-12">
        <div className="container-luxe max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h1 className="text-4xl font-bold text-white">{legal.title}</h1>
            <Button variant="outline" className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10" asChild>
              <a href="/api/legal/widerruf" download="Widerrufsbelehrung.pdf">
                <FileDown className="w-4 h-4 mr-2" />
                Widerruf als PDF herunterladen
              </a>
            </Button>
          </div>
          <LegalContentRender title="" content={legal.content} />
          <div className="mt-6">
            <WiderrufFormular />
          </div>
        </div>
      </div>
    )
  }
  const company = await getCompanyInfoAsync()
  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-4xl font-bold text-white">Widerrufsbelehrung</h1>
          <Button variant="outline" className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10" asChild>
            <a href="/api/legal/widerruf" download="Widerrufsbelehrung.pdf">
              <FileDown className="w-4 h-4 mr-2" />
              Widerruf als PDF herunterladen
            </a>
          </Button>
        </div>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6 space-y-6 text-luxe-silver">
            <div>
              <h2 className="text-xl font-bold text-white mb-3">Widerrufsrecht</h2>
              <p className="leading-relaxed">
                Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Widerrufsfrist</h2>
              <p className="leading-relaxed">
                Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter 
                Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Ausübung des Widerrufsrechts</h2>
              <p className="leading-relaxed mb-3">
                Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer eindeutigen Erklärung 
                (z.B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag 
                zu widerrufen, informieren.
              </p>
              <div className="bg-luxe-gray p-4 rounded-lg">
                <p className="text-white font-semibold mb-2">Kontaktdaten für Widerruf:</p>
                <p>
                  {company.name}<br />
                  {company.address}<br />
                  {company.postalCode} {company.city}<br />
                  E-Mail: <a href={`mailto:${company.email}`} className="text-luxe-gold hover:underline">{company.email}</a>
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Rücksendung</h2>
              <p className="leading-relaxed">
                Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, 
                an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Kosten der Rücksendung</h2>
              <p className="leading-relaxed">
                Sie tragen die unmittelbaren Kosten der Rücksendung der Waren. 
                Wir bieten Ihnen ein kostenloses Rücksendelabel an, wenn Sie uns kontaktieren.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Rückzahlung</h2>
              <p className="leading-relaxed">
                Wir werden Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der 
                Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine 
                andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), 
                unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzahlen, an dem die Mitteilung 
                über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
              </p>
            </div>

            <div id="ausnahmen" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-white mb-3">Ausnahmen vom Widerrufsrecht</h2>
              <p className="leading-relaxed mb-3">
                Nicht bei allen Produkten gilt das 14-tägige Widerrufsrecht. Ausnahmen gibt es u.a. bei:
              </p>
              <ul className="list-disc list-inside space-y-1 text-luxe-silver mb-3">
                <li>Hygienerelevanten Artikeln (z.B. bestimmte Mundstücke, Filter), sofern die Versiegelung entfernt wurde</li>
                <li>Personalisierte oder maßgefertigte Produkte</li>
                <li>Verschlossenen Waren, die aus Gründen des Gesundheitsschutzes nicht zur Rückgabe geeignet sind</li>
              </ul>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-200 font-semibold mb-2">Hinweis</p>
                    <p className="text-amber-200/90 text-sm leading-relaxed">
                      Bei Produkten mit möglichen Ausnahmen weisen wir dich im Shop darauf hin. Im Zweifel kontaktiere uns vor der Bestellung.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* EU-Gewährleistungs- und Garantie-Label (Pflicht ab 27.09.2026, Richtlinie (EU) 2024/825) */}
            <div id="gewaehrleistung" className="pt-6 border-t border-luxe-gray scroll-mt-24">
              <h2 className="text-xl font-bold text-white mb-3">Gewährleistung & Garantie</h2>
              <p className="leading-relaxed mb-2">
                Es gelten die gesetzlichen Gewährleistungsrechte (z. B. 2 Jahre bei Verbraucherkäufen). 
                Ab dem <strong>27. September 2026</strong> ist für den Online-Handel das <strong>EU-einheitliche Gewährleistungs- und Garantielabel</strong> Pflicht; 
                es informiert einheitlich über Dauer der Gewährleistung, Rechte bei Mängeln und ggf. freiwillige Garantie. 
                Wir werden das Label ab dem Stichtag hier und an den Produkten anzeigen, sobald die genaue Darstellung von der EU-Kommission festgelegt ist.
              </p>
              <p className="text-sm text-luxe-silver">
                Rechtlicher Stand: 20.02.2026. Bei Fragen: Impressum bzw. AGB.
              </p>
            </div>

            <WiderrufFormular />

            <div className="pt-6 border-t border-luxe-gray mt-6">
              <p className="text-sm">
                Stand: 20.02.2026<br />
                {company.name}
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-luxe-silver mt-8">
          ⚠️ Dies ist eine Muster-Widerrufsbelehrung. Bitte lasse sie von einem Rechtsanwalt prüfen!
        </p>
      </div>
    </div>
  )
}
