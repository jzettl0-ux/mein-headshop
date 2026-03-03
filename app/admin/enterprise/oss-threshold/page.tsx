'use client'

import { useState, useEffect } from 'react'
import { Globe, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Monitor = {
  monitor_id: string
  vendor_id: string
  target_country_code: string
  ttm_cross_border_revenue: number
  legal_threshold: number
  oss_registration_provided: boolean
  export_blocked: boolean
  warning_threshold: number
  last_calculated_at: string
}

export default function AdminOssThresholdPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/oss-threshold-monitor')
      .then((r) => (r.ok ? r.json() : { monitors: [] }))
      .then((d) => setMonitors(d.monitors ?? []))
      .catch(() => setMonitors([]))
      .finally(() => setLoading(false))
  }, [])

  const blocked = monitors.filter((m) => m.export_blocked)
  const warning = monitors.filter((m) => !m.export_blocked && m.ttm_cross_border_revenue >= m.warning_threshold)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-luxe-gold" />
          Cross-Border Tax &amp; OSS Threshold Monitor
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          EU 10.000 € Schwellenwert – 80% Warnung, 100% Block bei fehlender OSS-Registrierung.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : monitors.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Monitore. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">financial_defense.oss_threshold_monitor</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Vendor × Zielmarkt</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">
              {monitors.length} Einträge · {blocked.length} blockiert · {warning.length} Warnung
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {monitors.map((m) => (
                <li
                  key={m.monitor_id}
                  className={`flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0 ${
                    m.export_blocked ? 'text-red-400' : m.ttm_cross_border_revenue >= m.warning_threshold ? 'text-amber-400' : ''
                  }`}
                >
                  <span className="font-medium">
                    {m.vendor_id} → {m.target_country_code}
                    {m.export_blocked && <AlertTriangle className="inline w-4 h-4 ml-1" />}
                  </span>
                  <span>
                    {m.ttm_cross_border_revenue.toLocaleString('de-DE')} € / {m.legal_threshold.toLocaleString('de-DE')} €
                    {m.oss_registration_provided ? ' · OSS ✓' : ' · OSS fehlt'}
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
