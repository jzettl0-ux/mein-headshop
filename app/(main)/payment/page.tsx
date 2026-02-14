import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Smartphone, Building2, CheckCircle } from 'lucide-react'

export default function PaymentMethodsPage() {
  const paymentMethods = [
    {
      icon: CreditCard,
      name: 'Kreditkarte',
      description: 'Visa, Mastercard, American Express',
      features: ['Sofortige Bestätigung', 'Sicher verschlüsselt', '3D-Secure'],
    },
    {
      icon: Smartphone,
      name: 'iDEAL',
      description: 'Niederländische Online-Banking-Lösung',
      features: ['Beliebt in NL', 'Direkte Überweisung', 'Sofortige Bestätigung'],
    },
    {
      icon: Building2,
      name: 'Sofortüberweisung',
      description: 'Direkte Banküberweisung',
      features: ['Sofort verfügbar', 'Keine Registrierung', 'Sicher'],
    },
    {
      icon: CheckCircle,
      name: 'PayPal',
      description: 'Weltweit beliebt',
      features: ['Käuferschutz', 'Schnell', 'Sicher'],
    },
  ]

  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-4">Zahlungsmethoden</h1>
        <p className="text-luxe-silver text-lg mb-12">
          Wir bieten dir verschiedene sichere Zahlungsmöglichkeiten für deinen Einkauf.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            return (
              <Card key={method.name} className="bg-luxe-charcoal border-luxe-gray">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <div className="w-12 h-12 bg-luxe-gold/10 rounded-lg flex items-center justify-center mr-3">
                      <Icon className="w-6 h-6 text-luxe-gold" />
                    </div>
                    {method.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-luxe-silver mb-4">{method.description}</p>
                  <ul className="space-y-2">
                    {method.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm text-luxe-silver">
                        <CheckCircle className="w-4 h-4 text-luxe-neon mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6 space-y-6 text-luxe-silver">
            <div>
              <h2 className="text-xl font-bold text-white mb-3">Sicherheit</h2>
              <p className="leading-relaxed">
                Alle Zahlungen werden über unseren Partner Mollie abgewickelt. 
                Deine Zahlungsdaten sind durch SSL-Verschlüsselung geschützt und werden 
                niemals auf unseren Servern gespeichert.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Rechnungen</h2>
              <p className="leading-relaxed">
                Nach erfolgreicher Zahlung erhältst du automatisch eine Rechnung per Email. 
                Du kannst alle Rechnungen auch in deinem Account-Bereich einsehen und herunterladen.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Fragen?</h2>
              <p className="leading-relaxed">
                Bei Problemen mit der Zahlung kontaktiere uns unter{' '}
                <a href="mailto:support@premium-headshop.de" className="text-luxe-gold hover:underline">
                  support@premium-headshop.de
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
