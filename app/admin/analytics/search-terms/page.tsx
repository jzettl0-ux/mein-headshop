'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type TermRow = {
  term: string
  count: number
  clicks: number
  conversions: number
}

export default function AdminSearchTermsPage() {
  const [topTerms, setTopTerms] = useState<TermRow[]>([])
  const [totalEvents, setTotalEvents] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/search-autocomplete-analytics?limit=50')
      .then((r) => (r.ok ? r.json() : { topTerms: [], totalEvents: 0 }))
      .then((d) => {
        setTopTerms(d.topTerms ?? [])
        setTotalEvents(d.totalEvents ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Search className="w-6 h-6 text-luxe-gold" />
          Such-Autocomplete Analytics
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Top-Suchbegriffe, Klicks und Konversionen – Visual Autocomplete mit Debounce.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : topTerms.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Daten. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">frontend_ux.search_autocomplete_analytics</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Top-Suchbegriffe</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{totalEvents} Events, {topTerms.length} Begriffe</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {topTerms.map((t, i) => (
                <li key={t.term} className="flex items-center justify-between py-2 border-b border-luxe-gray/50 last:border-0">
                  <span className="flex items-center gap-2">
                    <span className="text-luxe-silver w-6">{i + 1}.</span>
                    <span className="font-medium text-white">{t.term}</span>
                  </span>
                  <span className="text-luxe-silver">
                    {t.count} Suchen · {t.clicks} Klicks · {t.conversions} Konversionen
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
