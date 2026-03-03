import { Card, CardContent } from '@/components/ui/card'
import { Truck, Package, Shield, Clock } from 'lucide-react'

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-4">Versand & Lieferung</h1>
        <p className="text-luxe-silver text-lg mb-12">
          Schnell, diskret und zuverlässig - so kommen deine Produkte zu dir.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-luxe-gold/10 rounded-lg flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-luxe-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Versandkosten-Übersicht</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-luxe-silver border-collapse">
                  <thead>
                    <tr className="border-b border-luxe-gray">
                      <th className="text-left py-2 pr-4 text-white font-medium">Bestellwert</th>
                      <th className="text-left py-2 pr-4 text-white font-medium">Standard</th>
                      <th className="text-left py-2 text-white font-medium">Mit 18+ Artikel</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-luxe-gray/60">
                      <td className="py-2 pr-4">unter 50 €</td>
                      <td className="py-2 pr-4">4,90 €</td>
                      <td className="py-2">6,90 € (inkl. Ident-Check 2,00 €)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 text-luxe-neon font-medium">50 € und mehr</td>
                      <td className="py-2 pr-4 text-luxe-neon font-medium">kostenlos</td>
                      <td className="py-2 text-luxe-neon font-medium">2,00 € (nur Ident-Check)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-luxe-silver/80 text-xs mt-3">Nur Deutschland. Keine Mindestbestellmenge.</p>
            </CardContent>
          </Card>

          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-luxe-gold/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-luxe-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Lieferzeit</h3>
              <p className="text-luxe-silver">
                2-5 Werktage<br />
                Versand innerhalb 24h<br />
                DHL Standard
              </p>
            </CardContent>
          </Card>

          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-luxe-gold/10 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-luxe-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Diskreter Versand</h3>
              <p className="text-luxe-silver">
                Neutrale Verpackung<br />
                Keine Logos<br />
                Sichere Verpackung
              </p>
            </CardContent>
          </Card>

          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-luxe-gold/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-luxe-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">18+ Verifikation</h3>
              <p className="text-luxe-silver">
                DHL Ident-Check<br />
                Ausweis erforderlich<br />
                +2,00€ Gebühr
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6 space-y-6 text-luxe-silver">
            <div>
              <h2 className="text-xl font-bold text-white mb-3">Versandpartner</h2>
              <p className="leading-relaxed">
                Wir versenden ausschließlich mit DHL, dem führenden Paketdienst in Deutschland. 
                DHL bietet zuverlässigen Service und Tracking für jedes Paket.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Tracking</h2>
              <p className="leading-relaxed">
                Sobald dein Paket versandt wurde, erhältst du automatisch eine Tracking-Nummer per Email. 
                Du kannst den Versandstatus jederzeit online verfolgen.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Versandgebiet</h2>
              <p className="leading-relaxed">
                Aktuell versenden wir nur innerhalb Deutschlands. Internationaler Versand ist in Planung.
              </p>
            </div>

            <div className="bg-luxe-gold/10 border border-luxe-gold/30 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">💡 Tipp:</h3>
              <p className="text-sm">
                Bestelle mehrere Artikel zusammen, um Versandkosten zu sparen. 
                Ab 50€ ist der Versand komplett kostenlos!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
