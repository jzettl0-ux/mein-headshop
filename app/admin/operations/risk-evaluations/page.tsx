'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldAlert, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Evaluation = {
  evaluation_id: string
  order_id: string
  order_number: string
  customer_id: string
  cart_total: number
  contains_high_risk_item: boolean
  required_avs_level: string | null
  evaluated_at: string
}

const avsLabel: Record<string, string> = {
  STANDARD_SCHUFA: 'Standard SCHUFA',
  BIOMETRIC_LIVENESS: 'Biometrie/Liveness',
}

export default function AdminRiskEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/risk-evaluations')
      .then((r) => (r.ok ? r.json() : { evaluations: [] }))
      .then((d) => setEvaluations(d.evaluations ?? []))
      .catch(() => setEvaluations([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-luxe-gold" />
          Risk Evaluations
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Risikobewertungen pro Bestellung (AVS-Level, High-Risk-Artikel). Basis für Betrugsprävention.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : evaluations.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Auswertungen. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">deep_tech.risk_evaluations</code> wird beim Checkout befüllt.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Auswertungen ({evaluations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {evaluations.map((e) => (
                <li
                  key={e.evaluation_id}
                  className="flex flex-wrap items-center gap-3 py-3 border-b border-luxe-gray/50 last:border-0"
                >
                  <span className="text-white font-mono text-sm">{e.order_number}</span>
                  <span className="text-luxe-silver text-sm">
                    Warenkorb: {Number(e.cart_total).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                  {e.contains_high_risk_item && (
                    <Badge variant="secondary" className="bg-amber-900/50 text-amber-200 text-xs">
                      High-Risk-Artikel
                    </Badge>
                  )}
                  {e.required_avs_level && (
                    <span className="text-luxe-silver text-sm">{avsLabel[e.required_avs_level] ?? e.required_avs_level}</span>
                  )}
                  <span className="text-luxe-silver/70 text-xs">
                    {new Date(e.evaluated_at).toLocaleString('de-DE')}
                  </span>
                  <Link
                    href={`/admin/orders/${e.order_id}`}
                    className="inline-flex items-center gap-1 text-sm text-luxe-gold hover:underline ml-auto"
                  >
                    Zur Bestellung
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
