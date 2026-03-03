'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquareWarning, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type NcxScore = {
  ncx_id: string
  product_id: string
  product_name: string
  product_slug: string | null
  total_orders: number
  negative_returns: number
  negative_reviews: number
  negative_messages: number
  total_negative_signals: number
  ncx_rate: number
  is_suppressed: boolean
  last_calculated_at: string
}

export default function AdminNcxPage() {
  const [scores, setScores] = useState<NcxScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/ncx-scores')
      .then((r) => (r.ok ? r.json() : { scores: [] }))
      .then((d) => setScores(d.scores ?? []))
      .catch(() => setScores([]))
      .finally(() => setLoading(false))
  }, [])

  const suppressed = scores.filter((s) => s.is_suppressed)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <MessageSquareWarning className="w-6 h-6 text-luxe-gold" />
          NCX-Score (Voice of the Customer)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Signal-Aggregation: Retouren, Reviews, A2Z – Suppression bei &gt;8 % NCX-Rate und ≥50 Bestellungen.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : scores.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine NCX-Scores. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">advanced_analytics.ncx_scores</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {suppressed.length > 0 && (
            <Card className="bg-luxe-charcoal border-amber-500/50">
              <CardHeader>
                <CardTitle className="text-amber-500 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Supprimierte Produkte ({suppressed.length})
                </CardTitle>
                <p className="text-sm text-luxe-silver font-normal">Plan of Action erforderlich</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {suppressed.map((s) => (
                    <li key={s.ncx_id} className="flex items-center justify-between py-2 border-b border-luxe-gray/50 last:border-0">
                      <Link href={s.product_slug ? `/admin/products/${s.product_id}/edit` : '#'} className="text-luxe-gold hover:underline font-medium">
                        {s.product_name || s.product_id}
                      </Link>
                      <span className="text-amber-500 font-medium">
                        {(s.ncx_rate * 100).toFixed(2)} % NCX · {s.total_orders} Bestellungen
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">Alle NCX-Scores</CardTitle>
              <p className="text-sm text-luxe-silver font-normal">{scores.length} Produkte (sortiert nach NCX-Rate)</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {scores.slice(0, 50).map((s) => (
                  <li key={s.ncx_id} className="flex items-center justify-between py-2 border-b border-luxe-gray/50 last:border-0">
                    <Link href={s.product_slug ? `/admin/products/${s.product_id}/edit` : '#'} className="text-luxe-gold hover:underline">
                      {s.product_name || s.product_id}
                    </Link>
                    <span className={s.is_suppressed ? 'text-amber-500' : 'text-luxe-silver'}>
                      {(s.ncx_rate * 100).toFixed(2)} % · {s.total_negative_signals} Signale · {s.total_orders} Bestellungen
                      {s.is_suppressed && ' · Supprimiert'}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
