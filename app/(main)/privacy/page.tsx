import { Card, CardContent } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Datenschutzerklärung</h1>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6 space-y-6 text-luxe-silver">
            <div>
              <h2 className="text-xl font-bold text-white mb-3">1. Datenschutz auf einen Blick</h2>
              <h3 className="text-lg font-semibold text-white mb-2">Allgemeine Hinweise</h3>
              <p className="leading-relaxed">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen 
                Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit 
                denen Sie persönlich identifiziert werden können.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Datenerfassung auf dieser Website</h3>
              <p className="leading-relaxed mb-3">
                <strong className="text-white">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. 
                Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">2. Hosting und CDN</h2>
              <h3 className="text-lg font-semibold text-white mb-2">Supabase</h3>
              <p className="leading-relaxed">
                Wir hosten unsere Datenbank bei Supabase. Anbieter ist Supabase Inc., 
                970 Toa Payoh North #07-04, Singapore 318992.<br /><br />
                Supabase verarbeitet Daten in unserem Auftrag und ist vertraglich an unsere Weisungen gebunden.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">3. Allgemeine Hinweise und Pflichtinformationen</h2>
              <h3 className="text-lg font-semibold text-white mb-2">Datenschutz</h3>
              <p className="leading-relaxed">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. 
                Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der 
                gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">4. Datenerfassung auf dieser Website</h2>
              <h3 className="text-lg font-semibold text-white mb-2">Cookies</h3>
              <p className="leading-relaxed">
                Unsere Internetseiten verwenden sogenannte "Cookies". Cookies sind kleine Textdateien und 
                richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die 
                Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Kontaktformular & E-Mail</h3>
              <p className="leading-relaxed">
                Wenn Sie uns per Kontaktformular oder E-Mail Anfragen zukommen lassen, werden Ihre Angaben 
                aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks 
                Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">5. Bestelldaten</h2>
              <p className="leading-relaxed">
                Zur Abwicklung Ihrer Bestellung speichern wir:<br />
                - Name und Lieferadresse<br />
                - E-Mail-Adresse<br />
                - Telefonnummer<br />
                - Bestellte Artikel<br />
                - Zahlungsinformationen<br /><br />
                Diese Daten werden für die Vertragsabwicklung benötigt und gemäß DSGVO Art. 6 Abs. 1 lit. b verarbeitet.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">6. Ihre Rechte</h2>
              <p className="leading-relaxed">
                Sie haben das Recht:<br />
                - Auskunft über Ihre gespeicherten Daten zu erhalten<br />
                - Berichtigung unrichtiger Daten zu verlangen<br />
                - Löschung Ihrer Daten zu verlangen<br />
                - Einschränkung der Verarbeitung zu verlangen<br />
                - Datenübertragbarkeit zu verlangen<br />
                - Widerspruch gegen die Verarbeitung einzulegen
              </p>
            </div>

            <div className="pt-6 border-t border-luxe-gray">
              <p className="text-sm">
                Stand: {new Date().toLocaleDateString('de-DE')}<br />
                Letzte Aktualisierung: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-luxe-silver mt-8">
          ⚠️ Dies ist eine Muster-Datenschutzerklärung. Bitte lasse sie von einem Rechtsanwalt prüfen!
        </p>
      </div>
    </div>
  )
}
