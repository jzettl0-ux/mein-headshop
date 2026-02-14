import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Widerrufsbelehrung</h1>

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
                  Premium Headshop GmbH<br />
                  Musterstraße 123<br />
                  12345 Berlin<br />
                  E-Mail: widerruf@premium-headshop.de
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

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-semibold mb-2">
                    Wichtig: Hygieneartikel
                  </p>
                  <p className="text-red-400/80 text-sm leading-relaxed">
                    Aus hygienischen Gründen können wir Produkte, die ausgepackt, benutzt oder beschädigt wurden, 
                    nicht zurücknehmen. Bitte prüfe die Ware bei Erhalt sorgfältig.
                  </p>
                </div>
              </div>
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
          ⚠️ Dies ist eine Muster-Widerrufsbelehrung. Bitte lasse sie von einem Rechtsanwalt prüfen!
        </p>
      </div>
    </div>
  )
}
