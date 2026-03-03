'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Cart = {
  cart_id: string
  customer_id: string | null
  session_id: string | null
  status: string
  merged_into_cart_id: string | null
  item_count: number
  created_at: string
  updated_at: string
}

export default function AdminCartsPage() {
  const [carts, setCarts] = useState<Cart[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/carts')
      .then((r) => (r.ok ? r.json() : { carts: [] }))
      .then((d) => setCarts(d.carts ?? []))
      .catch(() => setCarts([]))
      .finally(() => setLoading(false))
  }, [])

  const active = carts.filter((c) => c.status === 'ACTIVE')
  const abandoned = carts.filter((c) => c.status === 'ABANDONED')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-luxe-gold" />
          Warenkörbe (Cross-Device)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Aktive und verwaiste Warenkörbe – cart_management.shopping_carts für Merge-Logik bei Login.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : carts.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Warenkörbe. Tabellen <code className="text-xs bg-luxe-black px-1 rounded">cart_management.shopping_carts</code> und <code className="text-xs bg-luxe-black px-1 rounded">cart_items</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Warenkörbe ({carts.length})</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">
              {active.length} aktiv, {abandoned.length} verwaist
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {carts.map((c) => (
                <li key={c.cart_id} className="flex flex-wrap items-center gap-3 py-3 border-b border-luxe-gray/50 last:border-0">
                  <span className="text-luxe-silver font-mono text-xs">{String(c.cart_id).slice(0, 8)}…</span>
                  <Badge variant="secondary" className={c.status === 'ACTIVE' ? 'bg-green-900/50 text-green-200' : 'bg-luxe-gray text-luxe-silver'}>
                    {c.status === 'ACTIVE' ? 'Aktiv' : c.status}
                  </Badge>
                  <span className="text-white text-sm">{c.item_count} Artikel</span>
                  {c.customer_id && <span className="text-luxe-silver text-xs">User: {String(c.customer_id).slice(0, 8)}…</span>}
                  {c.session_id && !c.customer_id && <span className="text-luxe-silver text-xs">Gast</span>}
                  {c.merged_into_cart_id && <span className="text-luxe-silver text-xs">→ gemerged</span>}
                  <span className="text-luxe-silver/70 text-xs ml-auto">{new Date(c.updated_at).toLocaleString('de-DE')}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
