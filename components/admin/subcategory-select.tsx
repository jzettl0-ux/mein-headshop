'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import type { ProductCategory } from '@/lib/types'

interface ProductSubcategory {
  id: string
  parent_category: string
  slug: string
  name: string
}

interface SubcategorySelectProps {
  parentCategory: ProductCategory | string
  value: string | null
  onChange: (value: string | null) => void
  /** Verwende Admin-API (mit Auth) statt öffentliche API */
  useAdminApi?: boolean
}

export function SubcategorySelect({ parentCategory, value, onChange, useAdminApi }: SubcategorySelectProps) {
  const [subcategories, setSubcategories] = useState<ProductSubcategory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!parentCategory) {
      setSubcategories([])
      onChange(null)
      return
    }
    setLoading(true)
    const url = useAdminApi
      ? `/api/admin/subcategories?parent=${encodeURIComponent(parentCategory)}`
      : `/api/subcategories?parent=${encodeURIComponent(parentCategory)}`
    fetch(url)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ProductSubcategory[]) => {
        setSubcategories(Array.isArray(data) ? data : [])
        if (value && !(Array.isArray(data) ? data : []).some((s: { slug: string }) => s.slug === value)) {
          onChange(null)
        }
      })
      .catch(() => setSubcategories([]))
      .finally(() => setLoading(false))
  }, [parentCategory, useAdminApi])

  if (subcategories.length === 0 && !loading) {
    return (
      <div>
        <Label className="text-white">Unterkategorie (optional)</Label>
        <p className="text-xs text-luxe-silver mt-1">
          Noch keine Unterkategorien für diese Kategorie. Du kannst sie unter Admin → Kategorien anlegen.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Label htmlFor="subcategory" className="text-white">
        Unterkategorie (optional)
      </Label>
      <select
        id="subcategory"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? e.target.value : null)}
        className="w-full h-10 px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Keine</option>
        {subcategories.map((s) => (
          <option key={s.id} value={s.slug}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  )
}
