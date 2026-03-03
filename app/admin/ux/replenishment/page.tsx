'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Prediction = {
  prediction_id: string
  product_id: string
  product_name: string
  product_slug: string | null
  last_purchased_date: string
  next_expected_purchase_date: string
  calculated_cycle_days: number
}

export default function AdminReplenishmentPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/replenishment-predictions')
      .then((r) => (r.ok ? r.json() : { predictions: [], total: 0 }))
      .then((d) => {
        setPredictions(d.predictions ?? [])
        setTotal(d.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-luxe-gold" />
          Buy It Again / Replenishment
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Replenishment-Formel, Nudge 5 Tage vor Ablauf – Kunden mit berechneter Wiederbestell-Wahrscheinlichkeit.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : predictions.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Vorhersagen. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">frontend_ux.replenishment_predictions</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Aktive Replenishment-Nudges</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{total} gesamt (max. 200 angezeigt)</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {predictions.map((p) => (
                <li key={p.prediction_id} className="flex items-center justify-between py-2 border-b border-luxe-gray/50 last:border-0">
                  <Link href={p.product_slug ? `/admin/products/${p.product_id}/edit` : '#'} className="text-luxe-gold hover:underline">
                    {p.product_name || p.product_id}
                  </Link>
                  <span className="text-luxe-silver text-xs">
                    Zyklus {p.calculated_cycle_days} Tage · nächster: {new Date(p.next_expected_purchase_date).toLocaleDateString('de-DE')}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
