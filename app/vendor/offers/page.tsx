'use client'

import { useState, useEffect } from 'react'
import { Store, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function VendorOffersPage() {
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vendor/offers')
      .then((r) => (r.ok ? r.json() : { offers: [] }))
      .then((d) => setOffers(d.offers ?? []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Angebote</h1>
        <p className="text-luxe-silver mt-1">Dein Sortiment (Preis, Lager, Aktiv)</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-luxe-silver"><Loader2 className="w-5 h-5 animate-spin" /> Lade…</div>
      ) : offers.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Angebote vorhanden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((o) => (
            <Card key={o.id} className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{o.products?.name ?? 'Produkt'}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-luxe-silver">
                <p>Preis: {(o.price ?? 0).toFixed(2)} € | Lager: {o.stock ?? 0} | {o.is_active ? 'Aktiv' : 'Inaktiv'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
