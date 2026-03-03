'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Discrepancy = {
  discrepancy_id: string
  product_id: string
  product_name: string
  warehouse_location_id: string
  quantity_lost_or_damaged: number
  reason_code: string
  status: string
  detected_at: string
}

export default function AdminReimbursementsPage() {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/inventory-discrepancies')
      .then((r) => (r.ok ? r.json() : { discrepancies: [] }))
      .then((d) => setDiscrepancies(d.discrepancies ?? []))
      .catch(() => setDiscrepancies([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-luxe-gold" />
          FBA Lost &amp; Damaged Reimbursement
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Inventar-Discrepancies – WMS-Sync, Fair Market Value, Auto-Auszahlung.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : discrepancies.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Discrepancies. Tabellen <code className="text-xs bg-luxe-black px-1 rounded">warehouse_ops.inventory_discrepancies</code> und <code className="text-xs bg-luxe-black px-1 rounded">reimbursements</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Inventar-Discrepancies</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{discrepancies.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {discrepancies.map((d) => (
                <li key={d.discrepancy_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <Link href={`/admin/products/${d.product_id}/edit`} className="text-luxe-gold hover:underline font-medium">
                    {d.product_name || d.product_id}
                  </Link>
                  <span className="text-luxe-silver">
                    {d.quantity_lost_or_damaged} Stück · {d.reason_code} · {d.status} · {d.warehouse_location_id}
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
