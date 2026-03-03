'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Truck, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Eingegangen',
  PLANNING: 'In Planung',
  SHIPPED: 'Versendet',
  DELIVERED: 'Zugestellt',
  UNFULFILLABLE: 'Nicht lieferbar',
}

type McfOrder = {
  mcf_order_id: string
  vendor_id: string
  external_order_reference: string
  status: string
  shipping_address: Record<string, unknown> | null
  created_at: string
  vendor_accounts?: { company_name?: string } | null
}

export default function AdminMcfPage() {
  const [orders, setOrders] = useState<McfOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/mcf/orders')
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Truck className="w-6 h-6 text-luxe-gold" />
          MCF (Multi-Channel Fulfillment)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Externe Bestellungen (Shopify, WooCommerce) für FBN-Versand – Webhook: <code className="text-xs bg-luxe-black px-1 rounded">POST /api/webhooks/mcf/order</code>
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine MCF-Bestellungen. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">logistics.mcf_orders</code> über Migration anlegen. Externe Systeme senden Bestellungen an den Webhook.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">MCF-Bestellungen</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{orders.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {orders.map((o) => (
                <li key={o.mcf_order_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <Link href={`/admin/mcf/orders/${o.mcf_order_id}`} className="text-luxe-gold hover:underline font-medium">
                    {o.external_order_reference || o.mcf_order_id}
                  </Link>
                  <span className="text-luxe-silver">
                    {o.vendor_accounts?.company_name ?? o.vendor_id?.slice(0, 8)} · {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                  <span className="text-luxe-silver text-xs">{new Date(o.created_at).toLocaleDateString('de-DE')}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
