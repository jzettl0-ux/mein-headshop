'use client'

import { useState, useEffect } from 'react'
import { SlidersHorizontal, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Config = {
  config_id: string
  category_id: string
  category_name: string
  jsonb_attribute_key: string
  display_label: string
  ui_component_type: string
  sort_order: number
  is_active: boolean
}

const componentLabel: Record<string, string> = {
  CHECKBOX: 'Checkbox',
  RADIO: 'Radio',
  RANGE_SLIDER: 'Slider',
  COLOR_SWATCH: 'Farbe',
}

export default function AdminCategoryFacetsPage() {
  const [configs, setConfigs] = useState<Config[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/category-facets')
      .then((r) => (r.ok ? r.json() : { configs: [] }))
      .then((d) => setConfigs(d.configs ?? []))
      .catch(() => setConfigs([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-luxe-gold" />
          Category Facets
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Dynamische Filter pro Kategorie (storefront.category_facet_config) – Checkbox, Radio, Slider, Farb-Swatch.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : configs.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Facet-Configs. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">storefront.category_facet_config</code> über Migration anlegen (erfordert <code className="text-xs bg-luxe-black px-1 rounded">product_categories</code>).
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Facet-Configs ({configs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {configs.map((c) => (
                <li key={c.config_id} className="flex flex-wrap items-center gap-3 py-3 border-b border-luxe-gray/50 last:border-0">
                  <span className="text-white font-medium">{c.category_name}</span>
                  <span className="text-luxe-silver text-sm">{c.display_label}</span>
                  <code className="text-xs bg-luxe-black px-1 rounded text-luxe-silver">{c.jsonb_attribute_key}</code>
                  <Badge variant="secondary" className="bg-luxe-gray text-luxe-silver text-xs">
                    {componentLabel[c.ui_component_type] ?? c.ui_component_type}
                  </Badge>
                  {!c.is_active && <Badge variant="secondary" className="bg-amber-900/50 text-amber-200 text-xs">Inaktiv</Badge>}
                  <span className="text-luxe-silver/70 text-xs">Reihe {c.sort_order}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
