'use client'

import { useState, useEffect } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Order = {
  po_id: string
  supplier_id: string
  supplier_name: string
  target_warehouse_id: string
  total_cost_value: number
  expected_delivery_date: string
  status: string
  created_at: string
}

export default function AdminPurchaseOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [suppliers, setSuppliers] = useState<{ supplier_id: string; legal_name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/purchase-orders')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => {
        setOrders(d.orders ?? [])
        setSuppliers(d.suppliers ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-luxe-gold" />
          1P Vendor Central – Purchase Orders
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Großhandels-Bestellungen an Lieferanten.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : orders.length === 0 && suppliers.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Daten. Tabellen <code className="text-xs bg-luxe-black px-1 rounded">vendor_central.suppliers</code>, <code className="text-xs bg-luxe-black px-1 rounded">purchase_orders</code>, <code className="text-xs bg-luxe-black px-1 rounded">po_items</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Purchase Orders</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{orders.length} Bestellungen · {suppliers.length} Lieferanten</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {orders.map((o) => (
                <li key={o.po_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <div>
                    <p className="font-medium text-white">{o.supplier_name}</p>
                    <p className="text-luxe-silver text-xs mt-0.5">Warehouse: {o.target_warehouse_id} · Lieferung: {new Date(o.expected_delivery_date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <span className="text-luxe-gold font-medium">{o.total_cost_value?.toFixed(2)} €</span>
                  <span className="text-luxe-silver text-xs">{o.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
