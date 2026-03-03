'use client'

import { useState, useEffect } from 'react'
import { Truck, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type PO = {
  po_id: string
  supplier_id: string
  supplier_name: string
  target_warehouse_id: string
  total_cost_value: number
  expected_delivery_date: string
  status: string
  created_at: string
}

export default function AdminVendorCentralPage() {
  const [pos, setPos] = useState<PO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/purchase-orders')
      .then((r) => (r.ok ? r.json() : { purchaseOrders: [] }))
      .then((d) => setPos(d.purchaseOrders ?? []))
      .catch(() => setPos([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Truck className="w-6 h-6 text-luxe-gold" />
          1P Vendor Central (Purchase Orders)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Großhandels-Purchase Orders – Lieferanten, Wareneingang.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : pos.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Purchase Orders. Tabellen <code className="text-xs bg-luxe-black px-1 rounded">vendor_central.suppliers</code>, <code className="text-xs bg-luxe-black px-1 rounded">purchase_orders</code>, <code className="text-xs bg-luxe-black px-1 rounded">po_items</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Purchase Orders</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{pos.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {pos.map((po) => (
                <li key={po.po_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <div>
                    <p className="font-medium text-white">{po.supplier_name}</p>
                    <p className="text-luxe-silver text-xs mt-0.5">{po.target_warehouse_id} · Lieferung: {new Date(po.expected_delivery_date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <span className="text-luxe-silver">
                    {po.total_cost_value?.toLocaleString('de-DE')} € · {po.status}
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
