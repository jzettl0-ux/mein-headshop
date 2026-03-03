'use client'

import { useState, useEffect } from 'react'
import { Shield, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Plan = {
  plan_id: string
  applicable_category: string | null
  min_product_price: number
  max_product_price: number
  insurance_provider_id: string
  plan_price: number
  broker_commission_percentage: number
  is_active: boolean
  created_at: string
}

export default function AdminWarrantiesPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/warranty-plans')
      .then((r) => (r.ok ? r.json() : { plans: [] }))
      .then((d) => setPlans(d.plans ?? []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-luxe-gold" />
          Third-Party Warranties
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Garantie-Vermittlung, Broker-Provision – Cross-Selling.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : plans.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Warranty Plans. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">catalog.warranty_plans</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Warranty Plans</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{plans.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {plans.map((p) => (
                <li key={p.plan_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <div className="flex items-center gap-2">
                    {p.is_active ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-luxe-silver" />}
                    <span className="text-white font-medium">{p.insurance_provider_id}</span>
                    {p.applicable_category && <span className="text-luxe-silver">· {p.applicable_category}</span>}
                  </div>
                  <span className="text-luxe-silver">
                    {p.min_product_price}–{p.max_product_price} € · Plan: {p.plan_price} € · Provision: {p.broker_commission_percentage} %
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
