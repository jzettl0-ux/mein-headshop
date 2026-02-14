import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Impressum</h1>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6 space-y-6 text-luxe-silver">
            <div>
              <h2 className="text-xl font-bold text-white mb-3">Angaben gemäß § 5 TMG</h2>
              <p className="leading-relaxed">
                Premium Headshop GmbH<br />
                Musterstraße 123<br />
                12345 Berlin<br />
                Deutschland
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Kontakt</h2>
              <p className="leading-relaxed">
                Telefon: +49 (0) 123 456789<br />
                E-Mail: kontakt@premium-headshop.de<br />
                Website: www.premium-headshop.de
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Vertreten durch</h2>
              <p className="leading-relaxed">
                Geschäftsführer: Max Mustermann
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Registereintrag</h2>
              <p className="leading-relaxed">
                Eintragung im Handelsregister<br />
                Registergericht: Amtsgericht Berlin<br />
                Registernummer: HRB 123456
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Umsatzsteuer-ID</h2>
              <p className="leading-relaxed">
                Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
                DE123456789
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <p className="leading-relaxed">
                Max Mustermann<br />
                Musterstraße 123<br />
                12345 Berlin
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">EU-Streitschlichtung</h2>
              <p className="leading-relaxed">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:<br />
                <a href="https://ec.europa.eu/consumers/odr" className="text-luxe-gold hover:underline">
                  https://ec.europa.eu/consumers/odr
                </a><br />
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Verbraucherstreitbeilegung</h2>
              <p className="leading-relaxed">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>

            <div className="pt-6 border-t border-luxe-gray">
              <h2 className="text-xl font-bold text-white mb-3">Hinweis zur Altersbeschränkung</h2>
              <p className="leading-relaxed">
                🔞 Premium Headshop verkauft Produkte, die nur an Personen über 18 Jahre abgegeben werden dürfen.
                Der Verkauf an Minderjährige ist gesetzlich verboten und wird strafrechtlich verfolgt.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-luxe-silver mt-8">
          ⚠️ Dies ist ein Muster-Impressum. Bitte passe es mit deinen echten Daten an!
        </p>
      </div>
    </div>
  )
}
