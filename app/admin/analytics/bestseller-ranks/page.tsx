'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Row = { rank_id: string; asin: string; category_id: string; calculated_bsr_score: number; current_rank_position: number | null; updated_at: string }

export default function AdminBestsellerRanksPage() {
  const [list, setList] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/bestseller-ranks')
      .then((r) => {
        if (!r.ok) throw new Error('Tabelle möglicherweise nicht angelegt (catalog + admin.gated_categories)')
        return r.json()
      })
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch((e) => {
        setError(e.message)
        setList([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-luxe-primary" />
          Bestseller Ranks
        </h1>
        <p className="text-luxe-silver text-sm mt-1">
          BSR pro ASIN und Kategorie (catalog_automation.bestseller_ranks). Tabelle nur bei vorhandenem catalog ASIN und admin.gated_categories.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader><CardTitle>Ranks</CardTitle></CardHeader>
        <CardContent>
          {error && <p className="text-amber-500 text-sm mb-4">{error}</p>}
          {list.length === 0 && !error && <p className="text-luxe-silver">Keine Einträge. Neue Einträge per API POST (asin, category_id, calculated_bsr_score, current_rank_position).</p>}
          {list.length > 0 && (
            <div className="space-y-2">
              {list.map((r) => (
                <div key={r.rank_id} className="flex flex-wrap gap-4 p-3 rounded-lg bg-luxe-black/50 border border-luxe-gray text-sm">
                  <span className="font-mono">{r.asin}</span>
                  <span>Kategorie: {r.category_id}</span>
                  <span>Score: {Number(r.calculated_bsr_score).toFixed(4)}</span>
                  <span>Rang: {r.current_rank_position ?? '–'}</span>
                  <span className="text-luxe-silver">Stand: {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '–'}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
