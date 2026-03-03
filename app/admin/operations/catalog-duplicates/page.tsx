'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Copy, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Duplicate = {
  duplicate_id: string
  original_product_id: string
  duplicate_product_id: string
  original_name?: string
  original_slug?: string
  duplicate_name?: string
  duplicate_slug?: string
  similarity_score?: number
  status: string
  detected_at: string
}

const statusLabel: Record<string, string> = {
  PENDING_MERGE: 'Offen',
  MERGED: 'Zusammengeführt',
  DISMISSED: 'Abgelehnt',
}

export default function AdminCatalogDuplicatesPage() {
  const [duplicates, setDuplicates] = useState<Duplicate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/catalog-duplicates')
      .then((r) => (r.ok ? r.json() : { duplicates: [] }))
      .then((d) => setDuplicates(d.duplicates ?? []))
      .catch(() => setDuplicates([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Copy className="w-6 h-6 text-luxe-gold" />
          Catalog Duplicates
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Erkannte Katalog-Duplikate (Bild-Ähnlichkeit). Merge oder Ablehnung manuell in Produktverwaltung.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : duplicates.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Duplikate. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">deep_tech.catalog_duplicates</code> wird von Duplikat-Erkennung befüllt.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Duplikate ({duplicates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {duplicates.map((d) => (
                <li
                  key={d.duplicate_id}
                  className="flex flex-wrap items-center gap-3 py-3 border-b border-luxe-gray/50 last:border-0"
                >
                  <Badge variant="secondary" className="bg-luxe-gray text-luxe-silver text-xs">
                    {statusLabel[d.status] ?? d.status}
                  </Badge>
                  {d.similarity_score != null && (
                    <span className="text-luxe-silver text-sm">
                      Ähnlichkeit: {(Number(d.similarity_score) * 100).toFixed(1)} %
                    </span>
                  )}
                  <span className="text-white text-sm truncate max-w-[200px]" title={d.original_name}>
                    {d.original_name || d.original_product_id}
                  </span>
                  <span className="text-luxe-silver">→</span>
                  <span className="text-luxe-silver text-sm truncate max-w-[200px]" title={d.duplicate_name}>
                    {d.duplicate_name || d.duplicate_product_id}
                  </span>
                  <Link
                    href={`/admin/products/${d.original_product_id}`}
                    className="inline-flex items-center gap-1 text-xs text-luxe-gold hover:underline"
                  >
                    Original
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <Link
                    href={`/admin/products/${d.duplicate_product_id}`}
                    className="inline-flex items-center gap-1 text-xs text-luxe-gold hover:underline"
                  >
                    Duplikat
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <span className="text-luxe-silver/70 text-xs ml-auto">
                    {new Date(d.detected_at).toLocaleDateString('de-DE')}
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
