'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Radar, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Profile = {
  profile_id: string
  product_id: string
  product_name: string
  product_slug: string | null
  chart_type: string
  ui_color_hex: string | null
  updated_at: string
}

const CHART_LABELS: Record<string, string> = {
  RADAR: 'Radar/Spider',
  BAR: 'Balken',
  COLOR_WHEEL: 'Farbkreis',
}

export default function AdminSensoryPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/sensory-profiles')
      .then((r) => (r.ok ? r.json() : { profiles: [] }))
      .then((d) => setProfiles(d.profiles ?? []))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Radar className="w-6 h-6 text-luxe-gold" />
          Terpen- & Wirkungs-Visualizer (Sensory Profiles)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Radar-/Spider-Charts, Sensory Profiles – Darstellung pro Produkt.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : profiles.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Sensory Profiles. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">catalog.sensory_profiles</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Sensory Profiles</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{profiles.length} Produkte</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {profiles.map((p) => (
                <li key={p.profile_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <Link href={p.product_slug ? `/admin/products/${p.product_id}/edit` : '#'} className="text-luxe-gold hover:underline font-medium">
                    {p.product_name || p.product_id}
                  </Link>
                  <span className="text-luxe-silver">
                    {CHART_LABELS[p.chart_type] ?? p.chart_type}
                    {p.ui_color_hex && <span className="ml-2 inline-block w-3 h-3 rounded-full" style={{ backgroundColor: p.ui_color_hex }} />}
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
