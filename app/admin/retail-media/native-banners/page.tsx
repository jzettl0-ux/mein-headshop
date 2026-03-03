'use client'

import { useState, useEffect } from 'react'
import { LayoutGrid, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Banner = {
  banner_id: string
  vendor_id: string
  campaign_id: string
  media_url: string
  headline: string | null
  cta_link: string
  is_active: boolean
  created_at: string
}

export default function AdminNativeBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/native-banners')
      .then((r) => (r.ok ? r.json() : { banners: [] }))
      .then((d) => setBanners(d.banners ?? []))
      .catch(() => setBanners([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <LayoutGrid className="w-6 h-6 text-luxe-gold" />
          Native Bento-Grid Ads (Retail Media)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Nahtlose Integration ins Homepage-Layout – Kampagnen mit Media-URL und CTA.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : banners.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Banners. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">retail_media.native_banners</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Native Banners</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{banners.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {banners.map((b) => (
                <li key={b.banner_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <div>
                    <p className="font-medium text-white flex items-center gap-2">
                      {b.is_active ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-luxe-silver" />}
                      {b.headline || 'Ohne Überschrift'}
                    </p>
                    <p className="text-luxe-silver text-xs mt-0.5 truncate max-w-xl">{b.cta_link}</p>
                  </div>
                  <span className="text-luxe-silver text-xs">{new Date(b.created_at).toLocaleDateString('de-DE')}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
