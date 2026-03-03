'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart3, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
type SfrItem = {
  sfr_id: string
  search_term: string
  calculation_week: string
  platform_rank: number
  top_product_id_1: string | null
  click_share_1: number | null
  conversion_share_1: number | null
  top_product_name_1: string | null
  top_product_id_2: string | null
  click_share_2: number | null
  top_product_name_2: string | null
  top_product_id_3: string | null
  click_share_3: number | null
  top_product_name_3: string | null
}

export default function AdminSearchFrequencyRankPage() {
  const [items, setItems] = useState<SfrItem[]>([])
  const [loading, setLoading] = useState(true)
  const [term, setTerm] = useState('')

  const load = (t?: string) => {
    setLoading(true)
    const url = t ? `/api/admin/search-frequency-rank?term=${encodeURIComponent(t)}` : '/api/admin/search-frequency-rank'
    fetch(url)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(term || undefined)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-luxe-gold" />
          Search Frequency Rank (Brand Analytics)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Suchbegriffe nach Volumen ranken – Click Share &amp; Conversion Share pro Begriff.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Suchbegriff filtern..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="max-w-xs bg-luxe-charcoal border-luxe-gray"
        />
        <button type="submit" className="px-4 py-2 rounded bg-luxe-gold text-luxe-black text-sm font-medium hover:opacity-90">
          Suchen
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : items.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Einträge. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">advanced_analytics.search_frequency_rank</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Search Frequency Rank</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{items.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {items.map((i) => (
                <li key={i.sfr_id} className="py-2 border-b border-luxe-gray/50 last:border-0">
                  <p className="font-medium text-white">{i.search_term}</p>
                  <p className="text-luxe-silver text-xs mt-0.5">
                    Woche {new Date(i.calculation_week).toLocaleDateString('de-DE')} · Rank {i.platform_rank}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-luxe-silver/80 text-xs">
                    {i.top_product_id_1 && (
                      <Link href={`/admin/products/${i.top_product_id_1}/edit`} className="text-luxe-gold hover:underline">
                        #{1} {i.top_product_name_1 ?? '–'} (Click: {i.click_share_1 != null ? `${(i.click_share_1 * 100).toFixed(1)}%` : '–'})
                      </Link>
                    )}
                    {i.top_product_id_2 && (
                      <Link href={`/admin/products/${i.top_product_id_2}/edit`} className="text-luxe-gold hover:underline">
                        #{2} {i.top_product_name_2 ?? '–'} (Click: {i.click_share_2 != null ? `${(i.click_share_2 * 100).toFixed(1)}%` : '–'})
                      </Link>
                    )}
                    {i.top_product_id_3 && (
                      <Link href={`/admin/products/${i.top_product_id_3}/edit`} className="text-luxe-gold hover:underline">
                        #{3} {i.top_product_name_3 ?? '–'} (Click: {i.click_share_3 != null ? `${(i.click_share_3 * 100).toFixed(1)}%` : '–'})
                      </Link>
                    )}
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
