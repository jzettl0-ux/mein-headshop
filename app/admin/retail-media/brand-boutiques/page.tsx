'use client'

import { useState, useEffect } from 'react'
import { Store, Loader2, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type StoreRow = {
  store_id: string
  store_slug: string
  status: string
  primary_color_hex: string | null
  secondary_color_hex: string | null
  published_at: string | null
  created_at: string
}

export default function AdminBrandBoutiquesPage() {
  const [stores, setStores] = useState<StoreRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/brand-boutiques')
      .then((r) => (r.ok ? r.json() : { stores: [] }))
      .then((d) => setStores(d.stores ?? []))
      .catch(() => setStores([]))
      .finally(() => setLoading(false))
  }, [])

  const StatusIcon = ({ s }: { s: string }) => {
    if (s === 'PUBLISHED') return <CheckCircle className="h-4 w-4 text-emerald-500" />
    return <Clock className="h-4 w-4 text-luxe-silver" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Store className="w-6 h-6 text-luxe-gold" />
          Brand Boutiques (Shop-in-Shop)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Immersive Shop-in-Shop mit CI-Isolierung – eigene Farben, Hero-Video, Layout-Module.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : stores.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Brand Boutiques. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">brand_stores.custom_storefronts</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Brand Boutiques</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{stores.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {stores.map((s) => (
                <li key={s.store_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <StatusIcon s={s.status} />
                    <span className="font-medium text-white">{s.store_slug}</span>
                    {s.primary_color_hex && (
                      <span className="flex gap-1">
                        <span className="w-4 h-4 rounded border border-luxe-gray" style={{ backgroundColor: s.primary_color_hex }} />
                        {s.secondary_color_hex && <span className="w-4 h-4 rounded border border-luxe-gray" style={{ backgroundColor: s.secondary_color_hex }} />}
                      </span>
                    )}
                  </div>
                  <span className="text-luxe-silver text-xs">{s.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
