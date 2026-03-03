'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Policy = {
  policy_id: string
  product_id: string
  product_name: string
  minimum_advertised_price: number
  enforcement_action: string
  is_active: boolean
  created_at: string
}

type Violation = {
  violation_id: string
  vendor_id: string
  detected_price: number
  action_taken: boolean
  detected_at: string
}

export default function AdminMapEnforcementPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/map-policies')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => {
        setPolicies(d.policies ?? [])
        setViolations(d.violations ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-luxe-gold" />
          MAP Enforcement (Minimum Advertised Price)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Buy-Box-Suppression bei MAP-Verletzung – HIDE_PRICE, SUSPEND_LISTING.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : policies.length === 0 && violations.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Daten. Tabellen <code className="text-xs bg-luxe-black px-1 rounded">brand_enforcement.map_policies</code> und <code className="text-xs bg-luxe-black px-1 rounded">map_violations</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {violations.length > 0 && (
            <Card className="bg-luxe-charcoal border-amber-500/50">
              <CardHeader>
                <CardTitle className="text-amber-500 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Verletzungen ({violations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {violations.slice(0, 15).map((v) => (
                    <li key={v.violation_id} className="flex justify-between py-2 border-b border-luxe-gray/50 last:border-0">
                      <span className="text-luxe-silver">Vendor {v.vendor_id.slice(0, 8)}… · {v.detected_price} €</span>
                      <span className="text-luxe-silver text-xs">{new Date(v.detected_at).toLocaleDateString('de-DE')}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">MAP-Policies</CardTitle>
              <p className="text-sm text-luxe-silver font-normal">{policies.length} Einträge</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {policies.map((p) => (
                  <li key={p.policy_id} className="flex items-center justify-between py-2 border-b border-luxe-gray/50 last:border-0">
                    <Link href={`/admin/products/${p.product_id}/edit`} className="text-luxe-gold hover:underline">
                      {p.product_name || p.product_id}
                    </Link>
                    <span className="text-luxe-silver">MAP: {p.minimum_advertised_price} € · {p.enforcement_action}</span>
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
