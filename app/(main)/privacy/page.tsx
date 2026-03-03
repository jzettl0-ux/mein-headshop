import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { getCompanyInfoAsync } from '@/lib/company'
import { getLegalContent } from '@/lib/legal-content'
import { LegalContentRender } from '@/components/legal-content-render'

export default async function PrivacyPage() {
  const legal = await getLegalContent('privacy')
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
  const address = `${company.address}, ${company.postalCode} ${company.city}`

  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Datenschutzerklärung</h1>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6 space-y-6 text-luxe-silver">
            <div>
              <h2 className="text-xl font-bold text-white mb-3">1. Verantwortliche Stelle (Art. 4 Nr. 7 DSGVO)</h2>
              <p className="leading-relaxed mb-2">
                Verantwortlich für die Datenverarbeitung auf dieser Website ist:
              </p>
              <p className="leading-relaxed">
                {company.name}<br />
                {address}<br />
                {company.country}<br />
                E-Mail: <a href={`mailto:${company.email}`} className="text-luxe-gold hover:underline">{company.email}</a>
                {company.phone && <><br />Telefon: {company.phone}</>}
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">2. Datenschutz auf einen Blick</h2>
              <p className="leading-relaxed">
                Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. 
                Maßgeblich sind die Datenschutz-Grundverordnung (DSGVO), das BDSG und das Digitale-Dienste-Gesetz (DDG). 
                Die Anbieterkennzeichnung erfolgt im <Link href="/impressum" className="text-luxe-gold hover:underline">Impressum</Link> gemäß Art. 6 DDG.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">3. Auftragsverarbeiter (Art. 28 DSGVO)</h2>
              <p className="leading-relaxed mb-3">
                Wir setzen folgende Dienstleister ein, die personenbezogene Daten in unserem Auftrag verarbeiten. 
                Mit allen besteht ein Vertrag zur Auftragsverarbeitung (AVV).
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-white">Supabase</strong> (Datenbank, Auth) – Supabase Inc., Singapore. Daten können in der EU (Frankfurt) oder USA verarbeitet werden.</li>
                <li><strong className="text-white">Mollie</strong> (Zahlungsabwicklung) – Mollie B.V., Amsterdam, Niederlande.</li>
                <li><strong className="text-white">Resend</strong> (E-Mail-Versand) – Resend, Inc., USA (Standardvertragsklauseln).</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">4. Datenübertragung in Drittländer</h2>
              <p className="leading-relaxed">
                Soweit wir Daten in einem Drittland (z. B. USA, Singapore) verarbeiten lassen, erfolgt dies auf Basis 
                von Standardvertragsklauseln der EU-Kommission oder vergleichbaren Garantien gemäß Art. 46 DSGVO.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">5. Rechtsgrundlagen (Art. 6 DSGVO)</h2>
              <p className="leading-relaxed">
                Wir verarbeiten Daten auf Grundlage von: Vertragserfüllung (lit. b), gesetzlicher Verpflichtung (lit. c), 
                berechtigtem Interesse (lit. f) oder Ihrer Einwilligung (lit. a). Eine erteilte Einwilligung können Sie 
                jederzeit mit Wirkung für die Zukunft widerrufen.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">6. Bestelldaten und Vertragsabwicklung</h2>
              <p className="leading-relaxed">
                Zur Abwicklung Ihrer Bestellung speichern wir: Name, Lieferadresse, E-Mail, Telefon, bestellte Artikel 
                und Zahlungsinformationen (Transaktions-ID, keine Kreditkartendaten bei uns). 
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Speicherdauer: Handels- und steuerrechtliche Aufbewahrung 
                mindestens 10 Jahre.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Kontaktformular & E-Mail</h3>
              <p className="leading-relaxed">
                Anfragen per Kontaktformular oder E-Mail werden zur Bearbeitung und bei Anschlussfragen gespeichert. 
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b, lit. f DSGVO.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Newsletter und Willkommens-Rabatt</h3>
              <p className="leading-relaxed">
                Bei Anmeldung zum Newsletter speichern wir Ihre E-Mail zur Versendung von Informationen und Angeboten. 
                Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO. Ein eventuell gewährter Willkommens-Rabatt wird nicht 
                unmittelbar mitgeteilt, sondern per separater E-Mail in angemessenem zeitlichem Abstand zur Anmeldung 
                zugesandt. Abmeldung jederzeit per Link in der E-Mail oder über unser Kontaktformular möglich.
              </p>
            </div>

            <div id="cookies" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-white mb-3">7. Cookies und ähnliche Technologien</h2>
              <p className="leading-relaxed mb-4">
                Wir verwenden Cookies und ähnliche Technologien. Sie können Ihre Präferenzen jederzeit über die{' '}
                <Link href="/privacy#cookies" className="text-luxe-gold hover:underline">Cookie-Einstellungen</Link> im Footer anpassen.
              </p>

              <h3 className="text-lg font-semibold text-white mb-2">Technologien-Liste (Cookie-Richtlinie)</h3>
              <p className="text-sm text-luxe-silver/90 mb-3">
                Übersicht der verwendeten Technologien, Zweck, Anbieter und Speicherdauer:
              </p>
              <div className="overflow-x-auto rounded-lg border border-luxe-gray">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-luxe-gray bg-luxe-black/50">
                      <th className="px-4 py-3 text-white font-medium">Kategorie</th>
                      <th className="px-4 py-3 text-white font-medium">Zweck</th>
                      <th className="px-4 py-3 text-white font-medium">Anbieter</th>
                      <th className="px-4 py-3 text-white font-medium">Speicherdauer</th>
                      <th className="px-4 py-3 text-white font-medium">Einwilligung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-luxe-gray">
                    <tr>
                      <td className="px-4 py-3 text-white font-medium">Notwendig</td>
                      <td className="px-4 py-3">Session, Warenkorb, Anmeldung, Sicherheit, Betrugsprävention</td>
                      <td className="px-4 py-3">Eigene</td>
                      <td className="px-4 py-3">Sitzung / bis 1 Jahr</td>
                      <td className="px-4 py-3">Nicht erforderlich</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-white font-medium">Funktional</td>
                      <td className="px-4 py-3">Gespeicherte Einstellungen, Präferenzen, bessere Nutzerführung</td>
                      <td className="px-4 py-3">Eigene</td>
                      <td className="px-4 py-3">1 Jahr</td>
                      <td className="px-4 py-3">Ja</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-white font-medium">Analyse</td>
                      <td className="px-4 py-3">Aggregierte Nutzungsstatistiken, Seitenaufrufe, Verbesserung des Angebots</td>
                      <td className="px-4 py-3">Google Analytics (Google LLC)</td>
                      <td className="px-4 py-3">Bis 2 Jahre</td>
                      <td className="px-4 py-3">Ja</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-white font-medium">Personalisierung & Werbung</td>
                      <td className="px-4 py-3">Zielgerichtete Werbung, Remarketing, Nutzerprofile</td>
                      <td className="px-4 py-3">Google Ads, GTM (Google LLC)</td>
                      <td className="px-4 py-3">Bis 2 Jahre</td>
                      <td className="px-4 py-3">Ja</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-luxe-silver/80 mt-3">
                Detaillierte Informationen zu den verwendeten Diensten finden Sie in den jeweiligen Datenschutzerklärungen der Anbieter. 
                Bei Fragen: <Link href={`mailto:${company.email}`} className="text-luxe-gold hover:underline">{company.email}</Link>
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">8. Ihre Rechte (Art. 15–22, 77 DSGVO)</h2>
              <p className="leading-relaxed mb-2">
                Sie haben das Recht auf:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li><strong className="text-white">Auskunft</strong> (Art. 15) – welche Daten wir über Sie speichern</li>
                <li><strong className="text-white">Berichtigung</strong> (Art. 16) – unrichtige Daten korrigieren</li>
                <li><strong className="text-white">Löschung</strong> (Art. 17) – „Recht auf Vergessenwerden“</li>
                <li><strong className="text-white">Einschränkung</strong> (Art. 18) – Verarbeitung vorübergehend einschränken</li>
                <li><strong className="text-white">Datenübertragbarkeit</strong> (Art. 20) – Daten in strukturierter Form</li>
                <li><strong className="text-white">Widerspruch</strong> (Art. 21) – gegen Verarbeitung aus berechtigtem Interesse oder zu Werbezwecken</li>
                <li><strong className="text-white">Widerruf der Einwilligung</strong> (Art. 7 Abs. 3) – jederzeit mit Wirkung für die Zukunft</li>
                <li><strong className="text-white">Beschwerde bei einer Aufsichtsbehörde</strong> (Art. 77) – z. B. beim Landesdatenschutzbeauftragten Ihres Bundeslandes</li>
              </ul>
              <p className="leading-relaxed">
                Angemeldete Nutzer können unter <Link href="/profile/privacy" className="text-luxe-gold hover:underline">Datenschutz & Transparenz</Link> ihre 
                Daten exportieren oder die Konto-Löschung anfordern.
              </p>
            </div>

            <div className="pt-6 border-t border-luxe-gray">
              <p className="text-sm">
                Stand: Februar 2026 (DSGVO, BDSG, DDG).<br />
                Bitte lasse diese Erklärung von einem Rechtsanwalt prüfen und passe sie bei Bedarf an.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-luxe-silver mt-8">
          ⚠️ Muster-Datenschutzerklärung – von einem Rechtsanwalt prüfen lassen!
        </p>
      </div>
    </div>
  )
}
