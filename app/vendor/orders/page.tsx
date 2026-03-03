'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vendor/orders')
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bestellungen</h1>
        <p className="text-luxe-silver mt-1">Eigene Bestellungen und Versandstatus</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-luxe-silver"><Loader2 className="w-5 h-5 animate-spin" /> Lade…</div>
      ) : orders.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Bestellungen vorhanden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Card key={o.id} className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <Link href={`/vendor/orders/${o.id}`} className="text-luxe-gold hover:underline">
                    #{o.order_number ?? o.id?.slice(0, 8)}
                  </Link>
                  <span className="text-sm font-normal text-luxe-silver">{o.status ?? '–'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-luxe-silver">
                <p>Umsatz: {(o.total ?? 0).toFixed(2)} €</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
