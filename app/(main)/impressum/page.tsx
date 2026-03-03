import { Card, CardContent } from '@/components/ui/card'
import { getCompanyInfoAsync, getRepresentedByAsync } from '@/lib/company'
import { getLegalContent } from '@/lib/legal-content'
import { LegalContentRender } from '@/components/legal-content-render'

export default async function ImpressumPage() {
  const legal = await getLegalContent('impressum')
  if (legal?.content) {
    return (
      <div className="min-h-screen bg-luxe-black py-12">
        <div className="container-luxe max-w-4xl">
          <LegalContentRender title={legal.title} content={legal.content} />
        </div>
      </div>
    )
  }
  const company = await getCompanyInfoAsync()
  const representedBy = await getRepresentedByAsync()
  const fullAddress = `${company.address}, ${company.postalCode} ${company.city}`
  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Impressum</h1>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6 space-y-6 text-luxe-silver">
            <div>
              <h2 className="text-xl font-bold text-white mb-3">Angaben gemäß Art. 6 DDG (Digitale-Dienste-Gesetz)</h2>
              <p className="leading-relaxed">
                {company.name}<br />
                {company.address}<br />
                {company.postalCode} {company.city}<br />
                {company.country}
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Kontakt</h2>
              <p className="leading-relaxed">
                {company.phone && <>Telefon: {company.phone}<br /></>}
                E-Mail: <a href={`mailto:${company.email}`} className="text-luxe-gold hover:underline">{company.email}</a>
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Vertreten durch</h2>
              <p className="leading-relaxed">
                {representedBy}
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

            {company.vatId && (
              <div>
                <h2 className="text-xl font-bold text-white mb-3">Umsatzsteuer-ID</h2>
                <p className="leading-relaxed">
                  Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
                  {company.vatId}
                </p>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Verantwortlich für den Inhalt (RStV / DDG)</h2>
              <p className="leading-relaxed">
                {company.name}<br />
                {fullAddress}
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
              <p className="text-sm text-luxe-silver/80 mb-4">Stand: 20.02.2026 (DDG)</p>
              <h2 className="text-xl font-bold text-white mb-3">Hinweis zur Altersbeschränkung</h2>
              <p className="leading-relaxed">
                🔞 {company.name} verkauft Produkte, die nur an Personen über 18 Jahre abgegeben werden dürfen.
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
