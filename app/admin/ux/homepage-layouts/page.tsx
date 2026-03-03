'use client'

import { useState, useEffect } from 'react'
import { Layout, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type LayoutRow = {
  layout_id: string
  layout_name: string
  target_audience: string
  bento_grid_jsonb: unknown
  is_active: boolean
  priority: number
  updated_at: string
}

const AUDIENCE_LABELS: Record<string, string> = {
  GUEST: 'Gast',
  B2C_LOGGED_IN: 'B2C eingeloggt',
  B2B_CLUB: 'B2B Club',
  VIP_GOLD: 'VIP Gold',
}

export default function AdminHomepageLayoutsPage() {
  const [layouts, setLayouts] = useState<LayoutRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/homepage-layouts')
      .then((r) => (r.ok ? r.json() : { layouts: [] }))
      .then((d) => setLayouts(d.layouts ?? []))
      .catch(() => setLayouts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Layout className="w-6 h-6 text-luxe-gold" />
          Bento Grid Homepage Layouts
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Zielgruppen-spezifische Layouts – GUEST, B2C, B2B, VIP. Light Aesthetics, Whitespace, Gold-Akzente.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : layouts.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Layouts. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">ui_config.homepage_layouts</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Layouts</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{layouts.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {layouts.map((l) => (
                <li
                  key={l.layout_id}
                  className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-white">{l.layout_name}</p>
                    <p className="text-luxe-silver text-xs mt-0.5">
                      Zielgruppe: {AUDIENCE_LABELS[l.target_audience] ?? l.target_audience} · Priorität: {l.priority} · {l.is_active ? 'Aktiv' : 'Inaktiv'}
                    </p>
                    <pre className="text-xs text-luxe-silver/70 mt-1 overflow-x-auto max-w-2xl truncate">
                      {JSON.stringify(l.bento_grid_jsonb)?.slice(0, 120)}…
                    </pre>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
