'use client'

import { useState, useEffect } from 'react'

export type FacetItem = {
  config_id: string
  attribute_key: string
  display_label: string
  ui_component_type: string
  values: { attribute_value: string; display_label: string }[]
}

type FacetFiltersProps = {
  categorySlug: string | null
  selectedFacets: Record<string, string[]>
  onFacetsChange: (facets: Record<string, string[]>) => void
}

export function FacetFilters({ categorySlug, selectedFacets, onFacetsChange }: FacetFiltersProps) {
  const [facets, setFacets] = useState<FacetItem[]>([])

  useEffect(() => {
    if (!categorySlug) {
      setFacets([])
      return
    }
    fetch(`/api/shop/facets?category=${encodeURIComponent(categorySlug)}`)
      .then((r) => (r.ok ? r.json() : { facets: [] }))
      .then((d) => setFacets(d.facets ?? []))
      .catch(() => setFacets([]))
  }, [categorySlug])

  if (facets.length === 0) return null

  const toggle = (key: string, value: string) => {
    const current = selectedFacets[key] ?? []
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    onFacetsChange({ ...selectedFacets, [key]: next.length ? next : undefined } as Record<string, string[]>)
  }

  return (
    <div className="space-y-4 border-t border-luxe-gray pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-luxe-silver mb-3">Filter</h3>
      {facets.map((f) => (
        <div key={f.config_id} className="space-y-2">
          <p className="text-sm font-medium text-white">{f.display_label}</p>
          <div className="space-y-1.5">
            {f.values.map((v) => {
              const checked = (selectedFacets[f.attribute_key] ?? []).includes(v.attribute_value)
              return (
                <label
                  key={v.attribute_value}
                  className="flex items-center gap-2 cursor-pointer text-sm text-luxe-silver hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(f.attribute_key, v.attribute_value)}
                    className="rounded border-luxe-gray bg-luxe-charcoal text-luxe-gold focus:ring-luxe-gold"
                  />
                  {v.display_label}
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
