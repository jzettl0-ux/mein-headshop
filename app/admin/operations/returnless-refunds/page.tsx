'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Rule = {
  rule_id: string
  vendor_id: string
  max_price_threshold: number
  return_reason_condition: string | null
  is_active: boolean
  created_at: string
}

export default function AdminReturnlessRefundsPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/returnless-rules')
      .then((r) => (r.ok ? r.json() : { rules: [] }))
      .then((d) => setRules(d.rules ?? []))
      .catch(() => setRules([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-luxe-gold" />
          Returnless Refunds
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Preis unter Schwellenwert → kein Label, sofortige Erstattung.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : rules.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Regeln. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">margins.returnless_refund_rules</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Returnless Refund Rules</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{rules.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {rules.map((r) => (
                <li key={r.rule_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <span className="text-white font-medium">Max. {r.max_price_threshold?.toLocaleString('de-DE')} €</span>
                  <span className="text-luxe-silver">
                    {r.return_reason_condition || '–'} · {r.is_active ? 'Aktiv' : 'Inaktiv'}
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
