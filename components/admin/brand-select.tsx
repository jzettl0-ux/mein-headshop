'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BrandSelectProps {
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  className?: string
  /** Zusätzlicher Hinweistext unter dem Feld */
  hint?: string
}

export function BrandSelect({ value, onChange, id = 'brand', placeholder = 'z. B. Purize, RAW, Storz & Bickel', className, hint }: BrandSelectProps) {
  const [brands, setBrands] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products/brands').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/admin/brand-registry').then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([productBrands, registryBrands]) => {
      const fromProducts = Array.isArray(productBrands) ? productBrands : []
      const fromRegistry = Array.isArray(registryBrands) ? registryBrands.map((b: { name: string }) => b.name) : []
      const merged = [...new Set([...fromRegistry, ...fromProducts])].filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)))
      setBrands(merged)
    })
  }, [])

  return (
    <div>
      <Label htmlFor={id} className="text-white">
        Marke / Hersteller (optional)
      </Label>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={`${id}-datalist`}
        placeholder={placeholder}
        className={className ?? 'bg-luxe-gray border-luxe-silver text-white'}
      />
      <datalist id={`${id}-datalist`}>
        {brands.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      {hint && <p className="text-xs text-luxe-silver mt-1">{hint}</p>}
    </div>
  )
}
