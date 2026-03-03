'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Score = {
  customer_id: string
  total_orders_lifetime: number
  total_returns_lifetime: number
  atoz_claims_filed: number
  concession_rate: number
  requires_signature_on_delivery: boolean
  returnless_refunds_blocked: boolean
  last_evaluated_at: string
}

export default function AdminFraudScoresPage() {
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/buyer-health-scores')
      .then((r) => (r.ok ? r.json() : { scores: [] }))
      .then((d) => setScores(d.scores ?? []))
      .catch(() => setScores([]))
      .finally(() => setLoading(false))
  }, [])

  const flagged = scores.filter((s) => s.returnless_refunds_blocked || s.requires_signature_on_delivery)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-luxe-gold" />
          Buyer Health Scores (Fraud / Concession)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Concession-Rate – keine kostenlosen Retouren, OTP bei hohem Missbrauchsrisiko.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : scores.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Scores. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">fraud_prevention.buyer_health_scores</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {flagged.length > 0 && (
            <Card className="bg-luxe-charcoal border-amber-500/50">
              <CardHeader>
                <CardTitle className="text-amber-500">Geflaggte Kunden ({flagged.length})</CardTitle>
                <p className="text-sm text-luxe-silver font-normal">Friction aktiv: Signatur oder Returnless blockiert</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {flagged.map((s) => (
                    <li key={s.customer_id} className="flex justify-between py-2 border-b border-luxe-gray/50 last:border-0">
                      <span className="text-luxe-silver">#{s.customer_id.slice(0, 8)}</span>
                      <span className="text-amber-500">
                        {(s.concession_rate * 100).toFixed(2)} % Concession · {s.total_returns_lifetime} Retouren, {s.atoz_claims_filed} A2Z
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">Alle Buyer Health Scores</CardTitle>
              <p className="text-sm text-luxe-silver font-normal">{scores.length} Kunden</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {scores.slice(0, 50).map((s) => (
                  <li key={s.customer_id} className="flex justify-between py-2 border-b border-luxe-gray/50 last:border-0">
                    <span className="text-luxe-silver">#{s.customer_id.slice(0, 8)}</span>
                    <span className="text-luxe-silver">
                      {(s.concession_rate * 100).toFixed(2)} % · {s.total_orders_lifetime} Bestellungen
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
