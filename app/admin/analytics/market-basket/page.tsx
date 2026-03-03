'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Correlation = {
  correlation_id: string
  anchor_product_id: string
  anchor_product_name: string
  associated_category: string | null
  associated_brand_name: string | null
  correlation_percentage: number
  analyzed_timeframe_days: number
  last_calculated_at: string
}

export default function AdminMarketBasketPage() {
  const [correlations, setCorrelations] = useState<Correlation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/market-basket-correlations')
      .then((r) => (r.ok ? r.json() : { correlations: [] }))
      .then((d) => setCorrelations(d.correlations ?? []))
      .catch(() => setCorrelations([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-luxe-gold" />
          Market Basket Analysis (Share of Wallet)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Korrelationen pro Anker-Produkt – Kategorie, Marke, Korrelations-Prozentsatz.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : correlations.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Korrelationen. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">advanced_analytics.market_basket_correlations</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Market Basket Correlations</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{correlations.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {correlations.map((c) => (
                <li key={c.correlation_id} className="py-3 border-b border-luxe-gray/50 last:border-0">
                  <Link href={`/admin/products/${c.anchor_product_id}/edit`} className="text-luxe-gold hover:underline font-medium">
                    {c.anchor_product_name || c.anchor_product_id}
                  </Link>
                  <p className="text-luxe-silver text-xs mt-0.5">
                    {c.associated_category && <span>Kategorie: {c.associated_category}</span>}
                    {c.associated_category && c.associated_brand_name && ' · '}
                    {c.associated_brand_name && <span>Marke: {c.associated_brand_name}</span>}
                    {' · '}
                    {c.correlation_percentage} % · {c.analyzed_timeframe_days} Tage
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
