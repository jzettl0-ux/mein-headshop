'use client'

import { useState, useEffect } from 'react'
import { TrendingDown, Loader2, Smartphone, Monitor, Tablet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Dropoff = {
  dropoff_id: string
  cart_id: string
  last_completed_step: string
  step_label: string
  time_spent_in_checkout_seconds: number | null
  device_type: string | null
  abandoned_at: string
}

type Summary = {
  byStep: Record<string, number>
  byDevice: Record<string, number>
  total: number
}

export default function AdminCheckoutDropoffsPage() {
  const [dropoffs, setDropoffs] = useState<Dropoff[]>([])
  const [summary, setSummary] = useState<Summary>({ byStep: {}, byDevice: {}, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/checkout-dropoffs')
      .then((r) => (r.ok ? r.json() : { dropoffs: [], summary: {} }))
      .then((d) => {
        setDropoffs(d.dropoffs ?? [])
        setSummary(d.summary ?? { byStep: {}, byDevice: {}, total: 0 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const DeviceIcon = ({ t }: { t: string | null }) => {
    if (t === 'MOBILE') return <Smartphone className="h-4 w-4" />
    if (t === 'TABLET') return <Tablet className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-luxe-gold" />
          Checkout Funnel Dropoffs
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Abgebrochene Checkouts nach letztem Schritt – Cognitive Load, Trust-Signals optimieren.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : dropoffs.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Dropoffs. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">funnel_analytics.checkout_dropoffs</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-base text-white">Nach Schritt</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {Object.entries(summary.byStep).map(([step, n]) => (
                    <li key={step} className="flex justify-between">
                      <span className="text-luxe-silver">{step}</span>
                      <span className="text-white font-medium">{n}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-base text-white">Nach Gerät</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {Object.entries(summary.byDevice).map(([dev, n]) => (
                    <li key={dev} className="flex justify-between">
                      <span className="text-luxe-silver flex items-center gap-2">
                        <DeviceIcon t={dev} />
                        {dev}
                      </span>
                      <span className="text-white font-medium">{n}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">Letzte Dropoffs</CardTitle>
              <p className="text-sm text-luxe-silver font-normal">{summary.total} gesamt (max. 100 angezeigt)</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {dropoffs.slice(0, 30).map((d) => (
                  <li key={d.dropoff_id} className="flex items-center justify-between py-2 border-b border-luxe-gray/50 last:border-0">
                    <span className="text-luxe-silver">{d.step_label}</span>
                    <span className="flex items-center gap-2 text-luxe-silver">
                      <DeviceIcon t={d.device_type} />
                      {d.time_spent_in_checkout_seconds != null ? `${d.time_spent_in_checkout_seconds}s` : '–'}
                    </span>
                    <span className="text-luxe-silver text-xs">{new Date(d.abandoned_at).toLocaleString('de-DE')}</span>
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
