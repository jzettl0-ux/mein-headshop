'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProductCategory } from '@/lib/types'
import { Search } from 'lucide-react'

interface ProductFiltersProps {
  filters: {
    category: ProductCategory | null
    minPrice: number
    maxPrice: number
    isAdultOnly: boolean | undefined
    search: string
  }
  onFiltersChange: (filters: any) => void
}

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const categories: { value: ProductCategory | null; label: string }[] = [
    { value: null, label: 'Alle Kategorien' },
    { value: 'bongs', label: 'Bongs' },
    { value: 'grinder', label: 'Grinder' },
    { value: 'papers', label: 'Papers' },
    { value: 'vaporizer', label: 'Vaporizer' },
    { value: 'zubehoer', label: 'Zubehör' },
    { value: 'influencer-drops', label: 'Influencer Drops' },
  ]

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-white">
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

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-white">Kategorie</Label>
        <div className="space-y-2">
          {categories.map((cat) => (
            <button
              key={cat.value || 'all'}
              onClick={() =>
                onFiltersChange({ ...filters, category: cat.value })
              }
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                filters.category === cat.value
                  ? 'bg-luxe-gold text-luxe-black font-semibold'
                  : 'bg-luxe-charcoal text-luxe-silver hover:bg-luxe-gray'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="text-white">Preisspanne</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              placeholder="Min"
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
              placeholder="Max"
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

      {/* Adult Only Filter */}
      <div className="space-y-2">
        <Label className="text-white">Alterseinschränkung</Label>
        <div className="space-y-2">
          <button
            onClick={() =>
              onFiltersChange({ ...filters, isAdultOnly: undefined })
            }
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              filters.isAdultOnly === undefined
                ? 'bg-luxe-gold text-luxe-black font-semibold'
                : 'bg-luxe-charcoal text-luxe-silver hover:bg-luxe-gray'
            }`}
          >
            Alle Produkte
          </button>
          <button
            onClick={() => onFiltersChange({ ...filters, isAdultOnly: true })}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              filters.isAdultOnly === true
                ? 'bg-luxe-gold text-luxe-black font-semibold'
                : 'bg-luxe-charcoal text-luxe-silver hover:bg-luxe-gray'
            }`}
          >
            Nur 18+ Produkte
          </button>
          <button
            onClick={() => onFiltersChange({ ...filters, isAdultOnly: false })}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              filters.isAdultOnly === false
                ? 'bg-luxe-gold text-luxe-black font-semibold'
                : 'bg-luxe-charcoal text-luxe-silver hover:bg-luxe-gray'
            }`}
          >
            Ohne Altersbeschränkung
          </button>
        </div>
      </div>
    </div>
  )
}
