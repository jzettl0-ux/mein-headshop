'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Lot = {
  lot_id: string
  product_id: string
  product_name: string
  manufacturer_batch_number: string
  expiration_date: string
  quantity_available: number
  warehouse_bin_location: string
  status: string
  received_at: string
}

export default function AdminInventoryLotsPage() {
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/inventory-lots')
      .then((r) => (r.ok ? r.json() : { lots: [] }))
      .then((d) => setLots(d.lots ?? []))
      .catch(() => setLots([]))
      .finally(() => setLoading(false))
  }, [])

  const sellable = lots.filter((l) => l.status === 'SELLABLE')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-luxe-gold" />
          Lot-Tracking &amp; FEFO (First Expire, First Out)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Chargen mit MHD – WMS routet Picker zu Charge mit kürzester Haltbarkeit.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : lots.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Chargen. Tabelle wms_fefo.inventory_lots über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Chargen</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{lots.length} Einträge, {sellable.length} verkaufbar</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {lots.map((l) => (
                <li key={l.lot_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <Link href={l.product_id ? `/admin/products/${l.product_id}/edit` : '#'} className="text-luxe-gold hover:underline font-medium">
                    {l.product_name || l.product_id || '–'}
                  </Link>
                  <span className="text-luxe-silver">
                    {l.manufacturer_batch_number} · {l.warehouse_bin_location} · {l.quantity_available} Stk · MHD {l.expiration_date} · {l.status}
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
