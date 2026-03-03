'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Anomaly = {
  anomaly_id: string
  vendor_id: string
  product_id: string
  product_name: string
  anomaly_type: string
  trigger_value: number
  action_taken: string
  requires_2fa_unlock: boolean
  resolved_at: string | null
  detected_at: string
}

export default function AdminVelocityAnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/velocity-anomalies')
      .then((r) => (r.ok ? r.json() : { anomalies: [] }))
      .then((d) => setAnomalies(d.anomalies ?? []))
      .catch(() => setAnomalies([]))
      .finally(() => setLoading(false))
  }, [])

  const unresolved = anomalies.filter((a) => !a.resolved_at)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-luxe-gold" />
          Anti-Hijacking &amp; Sales Velocity Defense
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Preis-Drop oder Velocity-Spike – Account Frozen, 2FA-Freischaltung.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : anomalies.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Anomalien. financial_defense.velocity_anomalies über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Anomalien</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{anomalies.length} Einträge, {unresolved.length} offen</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {anomalies.map((a) => (
                <li key={a.anomaly_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <Link href={a.product_id ? `/admin/products/${a.product_id}/edit` : '#'} className="text-luxe-gold hover:underline font-medium">
                    {a.product_name || a.product_id || '–'}
                  </Link>
                  <span className="text-luxe-silver">
                    {a.anomaly_type} · {a.trigger_value} · {a.action_taken} · {a.resolved_at ? 'gelöst' : 'offen'}
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
