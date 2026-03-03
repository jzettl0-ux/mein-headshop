import Link from 'next/link'
import { ShieldCheck, ArrowRight, FileText, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCompanyInfoAsync } from '@/lib/company'

export const metadata = {
  title: 'A–Z Käuferschutz-Garantie',
  description: 'Erfahren Sie, wie unsere A–Z Käuferschutz-Garantie Sie bei Nichtlieferung, Beschädigung oder fehlerhafter Ware absichert – mit einfachem Anforderungsprozess.',
}

export default async function AZGarantiePage() {
  const company = await getCompanyInfoAsync()

  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-luxe-gold/20 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-luxe-gold" />
            </div>
            <h1 className="text-4xl font-bold text-white">A–Z Käuferschutz-Garantie</h1>
          </div>
          <p className="text-lg text-luxe-silver max-w-2xl">
            Unser Käuferschutz sorgt dafür, dass Sie sicher einkaufen können. Bei Problemen mit Ihrer Bestellung 
            stehen wir an Ihrer Seite – von A bis Z.
          </p>
        </div>

        <Card className="bg-luxe-charcoal border-luxe-gray mb-8">
          <CardContent className="pt-6 space-y-8 text-luxe-silver">
            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-luxe-gold" />
                Was ist die A–Z Garantie?
              </h2>
              <p className="leading-relaxed mb-4">
                Die A–Z Käuferschutz-Garantie ist unser Versprechen an Sie: Wenn Sie bei uns bestellen und 
                etwas schiefgeht – Lieferung kommt nicht an, Ware ist beschädigt oder entspricht nicht der 
                Beschreibung – greifen wir ein und kümmern uns um eine faire Lösung.
              </p>
              <p className="leading-relaxed">
                Sie müssen nicht mit dem Verkäufer streiten. Wir prüfen Ihren Fall und sorgen bei berechtigten 
                Ansprüchen für Erstattung oder Ersatz. Die Garantie ergänzt Ihre gesetzlichen Rechte (Gewährleistung, 
                Widerruf) und bietet zusätzliche Sicherheit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">Wann greift die A–Z Garantie?</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Nicht erhaltene Ware:</strong> Bestellung wurde bezahlt, aber nicht geliefert bzw. keine Lieferbestätigung.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Beschädigte oder defekte Ware:</strong> Artikel ist beim Transport beschädigt oder funktioniert nicht wie angegeben.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Nicht wie beschrieben:</strong> Gelieferte Ware weicht wesentlich von der Produktbeschreibung ab.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Unvollständige Lieferung:</strong> Ein oder mehrere bestellte Artikel fehlen im Paket.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-luxe-gold" />
                Frist & Ablauf
              </h2>
              <p className="leading-relaxed mb-4">
                Sie können eine A–Z Garantie-Anfrage in der Regel bis <strong className="text-white">90 Tage nach dem 
                voraussichtlichen Lieferdatum</strong> stellen. Bitte wenden Sie sich zuerst an uns oder den Händler, 
                um das Problem zu klären. Oft lässt sich schnell eine Lösung finden (Ersatz, Reparatur, Erstattung).
              </p>
              <p className="leading-relaxed">
                Wenn keine einvernehmliche Lösung zustande kommt, prüfen wir Ihren Fall und entscheiden über 
                Erstattung oder Ersatz. Unser Support antwortet in der Regel innerhalb von 24–48 Stunden.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">Was Sie für die Anforderung brauchen</h2>
              <ul className="list-disc list-inside space-y-1 text-luxe-silver mb-4">
                <li>Bestellnummer</li>
                <li>Kurze Schilderung des Problems (z. B. „Ware nicht angekommen“, „Glasbruch“, „Funktionsdefekt“)</li>
                <li>Optional: Fotos bei sichtbaren Mängeln</li>
              </ul>
              <p className="text-sm text-luxe-silver">
                Haben Sie bereits Kontakt mit uns aufgenommen? Dann verweisen Sie bitte in Ihrer Anfrage auf 
                den bisherigen Schriftverkehr.
              </p>
            </section>
          </CardContent>
        </Card>

        {/* CTA: A-Z Garantie anfordern */}
        <Card className="bg-luxe-charcoal border-luxe-gold/30">
          <CardContent className="pt-6 pb-6">
            <h2 className="text-xl font-bold text-white mb-2">A–Z Garantie anfordern</h2>
            <p className="text-luxe-silver mb-6 max-w-2xl">
              Sie haben ein Problem mit Ihrer Bestellung? Fordern Sie jetzt die A–Z Käuferschutz-Garantie an.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90">
                <Link href="/account/orders" className="inline-flex items-center gap-2">
                  Zu meinen Bestellungen
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10">
                <Link href={`/contact?subject=${encodeURIComponent('A-Z Garantie anfordern')}`} className="inline-flex items-center gap-2">
                  Per Kontaktformular anfragen
                </Link>
              </Button>
            </div>
            <p className="text-sm text-luxe-silver mt-4">
              Eingeloggt? Öffnen Sie die betroffene Bestellung unter „Meine Bestellungen“ und nutzen Sie den Button 
              „A–Z Garantie beantragen“. Nicht eingeloggt? Nutzen Sie das Kontaktformular und geben Sie Ihre 
              Bestellnummer an.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 rounded-lg bg-luxe-gray/30 text-sm text-luxe-silver">
          <p className="mb-2">
            <strong className="text-white">Kontakt:</strong> {company.name} · {company.email}
          </p>
          <p>
            Weitere rechtliche Informationen: <Link href="/terms" className="text-luxe-gold hover:underline">AGB</Link>, 
            <Link href="/returns" className="text-luxe-gold hover:underline ml-2">Widerrufsrecht</Link>, 
            <Link href="/returns#gewaehrleistung" className="text-luxe-gold hover:underline ml-2">Gewährleistung</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
