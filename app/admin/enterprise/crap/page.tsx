'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Metric = {
  crap_id: string
  product_id: string
  product_name: string
  calculated_net_ppm: number
  action_taken: string
  last_evaluated_at: string
}

export default function AdminCrapPage() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/crap-metrics')
      .then((r) => (r.ok ? r.json() : { metrics: [] }))
      .then((d) => setMetrics(d.metrics ?? []))
      .catch(() => setMetrics([]))
      .finally(() => setLoading(false))
  }, [])

  const suppressed = metrics.filter((m) => m.action_taken === 'SUPPRESSED')
  const addOn = metrics.filter((m) => m.action_taken === 'CONVERTED_TO_ADD_ON')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-luxe-gold" />
          CRAP-Algorithmus (Profit-Wächter)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Net PPM &lt; 0% → SUPPRESSED oder Add-on Item. Cron berechnet kontinuierlich.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : metrics.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine CRAP-Metriken. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">financial_defense.crap_metrics</code> über Migration anlegen. Cron berechnet Net PPM.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Net PPM &amp; Aktionen</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">
              {metrics.length} Einträge · {suppressed.length} supprimiert · {addOn.length} Add-on
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {metrics.map((m) => (
                <li key={m.crap_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <Link href={m.product_id ? `/admin/products/${m.product_id}/edit` : '#'} className="text-luxe-gold hover:underline font-medium">
                    {m.product_name || m.product_id || '–'}
                  </Link>
                  <span className="text-luxe-silver">
                    Net PPM: {(Number(m.calculated_net_ppm) * 100).toFixed(2)}% · {m.action_taken}
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
