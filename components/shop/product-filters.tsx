'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, ChevronRight, Leaf } from 'lucide-react'

export type FacetItem = {
  config_id: string
  attribute_key: string
  display_label: string
  ui_component_type: string
  values: { attribute_value: string; display_label: string }[]
}

interface ProductFiltersProps {
  categories: { value: string; label: string }[]
  filters: {
    category: string | null
    subcategory: string | null
    brand: string | null
    minPrice: number
    maxPrice: number
    isAdultOnly: boolean | undefined
    ecoOnly: boolean
    search: string
  }
  onFiltersChange: (filters: any) => void
  brands: string[]
  subcategories?: { slug: string; name: string }[]
  /** Category Facets (storefront) – dynamische Filter pro Kategorie */
  facets?: FacetItem[]
  selectedFacets?: Record<string, string[]>
  onFacetChange?: (attributeKey: string, value: string, checked: boolean) => void
}

export function ProductFilters({ categories: categoriesProp, filters, onFiltersChange, brands, subcategories = [], facets = [], selectedFacets = {}, onFacetChange }: ProductFiltersProps) {
  const categories: { value: string | null; label: string }[] = [
    { value: null, label: 'Alle Abteilungen' },
    ...categoriesProp.map((c) => ({ value: c.value, label: c.label })),
  ]

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-sm font-medium text-white">
          Suche
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-luxe-silver" />
          <Input
            id="search"
            type="text"
            placeholder="Produkte suchen..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-10 bg-luxe-charcoal border-luxe-gray text-white"
          />
        </div>
      </div>

      {/* Abteilungen mit Unterkategorien direkt unter der jeweiligen Kategorie */}
      <nav className="border-t border-luxe-gray pt-4" aria-label="Produktkategorien">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-luxe-silver mb-3">Abteilungen</h3>
        <ul className="space-y-0.5">
          {categories.map((cat) => {
            const isActive = filters.category === cat.value
            const showSubs = isActive && subcategories.length > 0
            return (
              <li key={cat.value || 'all'} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      onFiltersChange({ ...filters, category: null, subcategory: null })
                    } else {
                      onFiltersChange({ ...filters, category: cat.value, subcategory: null })
                    }
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-md transition-colors flex items-center justify-between gap-2 group ${
                    isActive
                      ? 'bg-luxe-gold/15 text-luxe-gold font-medium border-l border-luxe-gold'
                      : 'text-luxe-silver hover:bg-luxe-gray/30 hover:text-white border-l border-transparent'
                  }`}
                >
                  <span>{cat.label}</span>
                  {showSubs && (
                    <ChevronRight className="w-4 h-4 shrink-0 text-luxe-gold" aria-hidden />
                  )}
                </button>
                {/* Unterkategorien direkt unter der gewählten Kategorie */}
                {showSubs && (
                  <ul className="ml-3 pl-4 border-l-2 border-luxe-gray/50 space-y-0.5">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          if (filters.subcategory === null) {
                            onFiltersChange({ ...filters, category: null, subcategory: null })
                          } else {
                            onFiltersChange({ ...filters, subcategory: null })
                          }
                        }}
                        className={`w-full text-left py-1.5 px-2 rounded text-sm transition-colors ${
                          filters.subcategory === null
                            ? 'text-luxe-gold font-medium'
                            : 'text-luxe-silver hover:text-white'
                        }`}
                      >
                        Alle in {cat.label}
                      </button>
                    </li>
                    {subcategories.map((sub) => {
                      const isSubActive = filters.subcategory === sub.slug
                      return (
                        <li key={sub.slug}>
                          <button
                            type="button"
                            onClick={() => {
                              if (isSubActive) {
                                onFiltersChange({ ...filters, subcategory: null })
                              } else {
                                onFiltersChange({ ...filters, subcategory: sub.slug })
                              }
                            }}
                            className={`w-full text-left py-1.5 px-2 rounded text-sm transition-colors ${
                              isSubActive
                                ? 'text-luxe-gold font-medium'
                                : 'text-luxe-silver hover:text-white'
                            }`}
                          >
                            {sub.name}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Category Facets (dynamische Filter aus storefront) */}
      {facets.length > 0 && onFacetChange && (
        <div className="space-y-4 border-t border-luxe-gray pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-luxe-silver mb-3">Filter</h3>
          {facets.map((facet) => (
            <div key={facet.config_id} className="space-y-2">
              <span className="text-sm font-medium text-white block mb-2">{facet.display_label}</span>
              <div className="space-y-1.5">
                {facet.values.map((v) => {
                  const sel = selectedFacets[facet.attribute_key] ?? []
                  const checked = sel.includes(v.attribute_value)
                  return (
                    <label key={v.attribute_value} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onFacetChange(facet.attribute_key, v.attribute_value, e.target.checked)}
                        className="rounded border-luxe-gray bg-luxe-charcoal text-luxe-gold focus:ring-luxe-gold"
                      />
                      <span className={checked ? 'text-luxe-gold' : 'text-luxe-silver'}>{v.display_label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Marke / Hersteller */}
      {brands.length > 0 && (
        <div className="space-y-2 border-t border-luxe-gray pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-luxe-silver mb-3">Marke</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                if (filters.brand !== null) onFiltersChange({ ...filters, brand: null })
              }}
              className={`w-full text-left py-2 px-2 rounded text-sm transition-colors ${
                filters.brand === null ? 'text-luxe-gold font-medium' : 'text-luxe-silver hover:text-white'
              }`}
            >
              Alle Marken
            </button>
            {brands.map((b) => {
              const isBrandActive = filters.brand === b
              return (
                <button
                  key={b}
                  onClick={() => {
                    if (isBrandActive) {
                      onFiltersChange({ ...filters, brand: null })
                    } else {
                      onFiltersChange({ ...filters, brand: b })
                    }
                  }}
                  className={`w-full text-left py-2 px-2 rounded text-sm transition-colors ${
                    isBrandActive ? 'text-luxe-gold font-medium' : 'text-luxe-silver hover:text-white'
                  }`}
                >
                  {b}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-2 border-t border-luxe-gray pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-luxe-silver mb-3">Preisspanne</h3>
          <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              type="number"
              placeholder="Ab (€)"
              value={filters.minPrice}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  minPrice: Number(e.target.value),
                })
              }
              className="bg-luxe-charcoal border-luxe-gray text-white"
            />
            <span className="text-luxe-silver">-</span>
            <Input
              type="number"
              placeholder="Bis (€)"
              value={filters.maxPrice}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  maxPrice: Number(e.target.value),
                })
              }
              className="bg-luxe-charcoal border-luxe-gray text-white"
            />
          </div>
        </div>
      </div>

      {/* Nachhaltigkeit */}
      <div className="space-y-2 border-t border-luxe-gray pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-luxe-silver mb-3">Nachhaltigkeit</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              if (filters.ecoOnly) onFiltersChange({ ...filters, ecoOnly: false })
            }}
            className={`w-full text-left py-2 px-2 rounded text-sm transition-colors flex items-center gap-2 ${
              !filters.ecoOnly ? 'text-luxe-gold font-medium' : 'text-luxe-silver hover:text-white hover:bg-luxe-gray/30'
            }`}
          >
            Alle Produkte
          </button>
          <button
            onClick={() => {
              if (filters.ecoOnly) {
                onFiltersChange({ ...filters, ecoOnly: false })
              } else {
                onFiltersChange({ ...filters, ecoOnly: true })
              }
            }}
            className={`w-full text-left py-2 px-2 rounded text-sm transition-colors flex items-center gap-2 ${
              filters.ecoOnly ? 'text-luxe-gold font-medium' : 'text-luxe-silver hover:text-white hover:bg-luxe-gray/30'
            }`}
          >
            <Leaf className="w-4 h-4 text-emerald-500 shrink-0" />
            Nur nachhaltige Produkte
          </button>
        </div>
      </div>

      {/* Adult Only Filter */}
      <div className="space-y-2 border-t border-luxe-gray pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-luxe-silver mb-3">Alterseinschränkung</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              if (filters.isAdultOnly !== undefined) onFiltersChange({ ...filters, isAdultOnly: undefined })
            }}
            className={`w-full text-left py-2 px-2 rounded text-sm transition-colors ${
              filters.isAdultOnly === undefined ? 'text-luxe-gold font-medium' : 'text-luxe-silver hover:text-white'
            }`}
          >
            Alle Produkte
          </button>
          <button
            onClick={() => {
              if (filters.isAdultOnly === true) {
                onFiltersChange({ ...filters, isAdultOnly: undefined })
              } else {
                onFiltersChange({ ...filters, isAdultOnly: true })
              }
            }}
            className={`w-full text-left py-2 px-2 rounded text-sm transition-colors ${
              filters.isAdultOnly === true ? 'text-luxe-gold font-medium' : 'text-luxe-silver hover:text-white'
            }`}
          >
            Nur 18+ Produkte
          </button>
          <button
            onClick={() => {
              if (filters.isAdultOnly === false) {
                onFiltersChange({ ...filters, isAdultOnly: undefined })
              } else {
                onFiltersChange({ ...filters, isAdultOnly: false })
              }
            }}
            className={`w-full text-left py-2 px-2 rounded text-sm transition-colors ${
              filters.isAdultOnly === false ? 'text-luxe-gold font-medium' : 'text-luxe-silver hover:text-white'
            }`}
          >
            Ohne Altersbeschränkung
          </button>
        </div>
      </div>
    </div>
  )
}
