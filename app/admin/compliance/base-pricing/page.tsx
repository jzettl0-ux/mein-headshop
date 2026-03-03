'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calculator, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Rule = {
  rule_id: string
  product_id: string
  product_name: string
  product_slug: string | null
  net_content_value: number
  net_content_unit: string
  reference_value: number
  base_price_multiplier: number
}

export default function AdminBasePricingPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/base-pricing-rules')
      .then((r) => (r.ok ? r.json() : { rules: [] }))
      .then((d) => setRules(d.rules ?? []))
      .catch(() => setRules([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Calculator className="w-6 h-6 text-luxe-gold" />
          PAngV Grundpreis-Engine
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Automatische Grundpreis-Kalkulation, Bulk-Upselling – Preis pro Einheit nach PAngV.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : rules.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Regeln. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">legal_compliance.base_pricing_rules</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Grundpreis-Regeln</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{rules.length} Produkte</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {rules.map((r) => (
                <li key={r.rule_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <Link href={r.product_slug ? `/admin/products/${r.product_id}/edit` : '#'} className="text-luxe-gold hover:underline font-medium">
                    {r.product_name || r.product_id}
                  </Link>
                  <span className="text-luxe-silver">
                    {r.net_content_value} {r.net_content_unit} · Referenz: {r.reference_value} · Multiplikator: {r.base_price_multiplier?.toFixed(4)}
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
