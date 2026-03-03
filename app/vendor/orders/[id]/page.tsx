'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function VendorOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/vendor/orders/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/vendor/orders" className="inline-flex items-center gap-2 text-luxe-silver hover:text-luxe-gold text-sm">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <div className="flex items-center gap-2 text-luxe-silver"><Loader2 className="w-5 h-5 animate-spin" /> Lade…</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Link href="/vendor/orders" className="inline-flex items-center gap-2 text-luxe-silver hover:text-luxe-gold text-sm">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Bestellung nicht gefunden.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/vendor/orders" className="inline-flex items-center gap-2 text-luxe-silver hover:text-luxe-gold text-sm">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            Bestellung #{order.order_number ?? id?.slice(0, 8)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-luxe-silver space-y-2">
          <p>Status: {order.status ?? '–'}</p>
          <p>Dein Anteil: {(order.vendor_total ?? 0).toFixed(2)} €</p>
          {order.items?.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-white">Positionen:</p>
              <ul className="list-disc list-inside mt-2">
                {order.items.map((i: any) => (
                  <li key={i.id}>{i.products?.name ?? 'Artikel'} – {(i.price ?? 0).toFixed(2)} € × {i.quantity ?? 1}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
