import { Card, CardContent } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6 space-y-6 text-luxe-silver">
            <div>
              <h2 className="text-xl font-bold text-white mb-3">§ 1 Geltungsbereich & Altersbeschränkung</h2>
              <p className="leading-relaxed">
                (1) Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge über die Lieferung von 
                Waren, die zwischen Premium Headshop GmbH (nachfolgend "Verkäufer") und dem Kunden 
                (nachfolgend "Kunde") geschlossen werden.<br /><br />
                
                (2) <strong className="text-red-400">🔞 WICHTIG:</strong> Der Verkauf richtet sich ausschließlich 
                an Personen über 18 Jahre. Minderjährige sind vom Kauf ausgeschlossen. Mit der Bestellung 
                bestätigt der Kunde, dass er mindestens 18 Jahre alt ist.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">§ 2 Vertragsschluss</h2>
              <p className="leading-relaxed">
                (1) Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot dar.<br /><br />
                
                (2) Durch Anklicken des Buttons "Zahlungspflichtig bestellen" gibt der Kunde ein bindendes 
                Angebot zum Kauf der im Warenkorb befindlichen Waren ab.<br /><br />
                
                (3) Der Verkäufer bestätigt den Eingang der Bestellung durch eine automatische E-Mail. 
                Diese Bestätigungs-E-Mail stellt die Annahme des Angebots dar.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">§ 3 Preise und Versandkosten</h2>
              <p className="leading-relaxed">
                (1) Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.<br /><br />
                
                (2) Zusätzlich zu den angegebenen Preisen berechnen wir für die Lieferung innerhalb 
                Deutschlands Versandkosten in Höhe von 4,90 €.<br /><br />
                
                (3) <strong className="text-red-400">Alterssichtprüfung:</strong> Bei Bestellungen mit 
                Produkten, die nur an Personen über 18 Jahre abgegeben werden dürfen, fallen zusätzliche 
                Kosten in Höhe von 2,00 € für die DHL Alterssichtprüfung an.<br /><br />
                
                (4) Ab einem Bestellwert von 50 € liefern wir versandkostenfrei.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">§ 4 Lieferung und Verfügbarkeit</h2>
              <p className="leading-relaxed">
                (1) Die Lieferung erfolgt in Deutschland.<br /><br />
                
                (2) Die Lieferzeit beträgt 2-5 Werktage.<br /><br />
                
                (3) Sollte das bestellte Produkt nicht verfügbar sein, informieren wir den Kunden 
                unverzüglich und bieten eine Erstattung oder einen Ersatzartikel an.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">§ 5 Alterssichtprüfung (18+)</h2>
              <p className="leading-relaxed">
                (1) Produkte, die nur an Personen über 18 Jahre abgegeben werden dürfen, werden 
                ausschließlich per DHL mit Alterssichtprüfung versendet.<br /><br />
                
                (2) Bei der Zustellung muss der Empfänger ein gültiges Ausweisdokument vorlegen.<br /><br />
                
                (3) Kann die Alterssichtprüfung nicht durchgeführt werden, wird die Sendung zurückgeschickt. 
                Die Kosten für die Rücksendung trägt der Kunde.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">§ 6 Zahlungsbedingungen</h2>
              <p className="leading-relaxed">
                (1) Wir akzeptieren folgende Zahlungsarten:<br />
                - Vorkasse (Überweisung)<br />
                - PayPal<br />
                - Kreditkarte<br /><br />
                
                (2) Bei Zahlung per Vorkasse nennen wir Ihnen unsere Bankverbindung in der 
                Bestellbestätigung. Der Kaufpreis ist sofort zur Zahlung fällig.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">§ 7 Widerrufsrecht</h2>
              <p className="leading-relaxed">
                Verbrauchern steht ein Widerrufsrecht nach Maßgabe der gesetzlichen Bestimmungen zu. 
                Details entnehmen Sie bitte unserer Widerrufsbelehrung.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">§ 8 Gewährleistung</h2>
              <p className="leading-relaxed">
                Es gelten die gesetzlichen Gewährleistungsrechte.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">§ 9 Haftung</h2>
              <p className="leading-relaxed">
                Für Ansprüche aufgrund von Schäden, die durch uns, unsere gesetzlichen Vertreter oder 
                Erfüllungsgehilfen verursacht wurden, haften wir stets unbeschränkt.
              </p>
            </div>

            <div className="pt-6 border-t border-luxe-gray">
              <p className="text-sm">
                Stand: {new Date().toLocaleDateString('de-DE')}<br />
                Premium Headshop GmbH
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-luxe-silver mt-8">
          ⚠️ Dies sind Muster-AGB. Bitte lasse sie von einem Rechtsanwalt prüfen und anpassen!
        </p>
      </div>
    </div>
  )
}
