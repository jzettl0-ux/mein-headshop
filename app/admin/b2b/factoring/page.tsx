'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Agreement = {
  agreement_id: string
  b2b_customer_id: string
  factoring_provider: string
  approved_credit_limit: number
  current_utilized_credit: number
  payment_terms_days: number
  status: string
}

export default function AdminFactoringPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/factoring-agreements')
      .then((r) => (r.ok ? r.json() : { agreements: [] }))
      .then((d) => setAgreements(d.agreements ?? []))
      .catch(() => setAgreements([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-luxe-gold" />
          B2B Pay by Invoice (Factoring)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Mondu/Billie-Integration, Bonitätsprüfung, Netto 30/60.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : agreements.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Factoring-Agreements. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">b2b_finance.factoring_agreements</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Factoring Agreements</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{agreements.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {agreements.map((a) => (
                <li key={a.agreement_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <div>
                    <p className="font-medium text-white">{a.factoring_provider} · B2B #{a.b2b_customer_id.slice(0, 8)}</p>
                    <p className="text-luxe-silver text-xs mt-0.5">Netto {a.payment_terms_days} Tage · {a.status}</p>
                  </div>
                  <span className="text-luxe-silver">
                    {a.current_utilized_credit?.toLocaleString('de-DE')} / {a.approved_credit_limit?.toLocaleString('de-DE')} €
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
