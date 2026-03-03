'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClipboardCheck, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Inspection = {
  id: string
  order_id: string
  order_number: string
  status: string
  condition_code: string | null
  restocking_fee_cents: number
  notes: string | null
  received_at: string | null
  inspected_at: string | null
  inspected_by_email: string | null
  created_at: string
}

const statusLabel: Record<string, string> = {
  received: 'Eingegangen',
  inspecting: 'In Prüfung',
  inspected: 'Geprüft',
}

const conditionLabel: Record<string, string> = {
  as_new: 'Wie neu',
  minor_damage: 'Leichte Beschädigung',
  major_damage: 'Starke Beschädigung',
  not_restockable: 'Nicht einlagerbar',
}

export default function AdminReturnInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/return-inspections')
      .then((r) => (r.ok ? r.json() : { inspections: [] }))
      .then((d) => setInspections(d.inspections ?? []))
      .catch(() => setInspections([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-luxe-gold" />
          Retourenprüfung
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Übersicht aller Retourenprüfungen – Zustand, Restocking Fee, Erstattung. Details und Bearbeitung in der jeweiligen Bestellung.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : inspections.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Retourenprüfungen. Sie erscheinen hier, sobald eine Retoure als „eingegangen“ markiert wurde (Bestelldetail → Retoure bearbeiten).
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Prüfungen ({inspections.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {inspections.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-3 py-3 border-b border-luxe-gray/50 last:border-0"
                >
                  <span className="text-white font-mono text-sm">{r.order_number}</span>
                  <Badge variant="secondary" className="bg-luxe-gray text-luxe-silver text-xs">
                    {statusLabel[r.status] ?? r.status}
                  </Badge>
                  {r.condition_code && (
                    <span className="text-luxe-silver text-sm">{conditionLabel[r.condition_code] ?? r.condition_code}</span>
                  )}
                  {r.restocking_fee_cents > 0 && (
                    <span className="text-luxe-silver text-sm">Bearbeitung: {(r.restocking_fee_cents / 100).toFixed(2)} €</span>
                  )}
                  {r.inspected_at && (
                    <span className="text-luxe-silver/80 text-xs">
                      Geprüft {new Date(r.inspected_at).toLocaleDateString('de-DE')}
                      {r.inspected_by_email ? ` von ${r.inspected_by_email}` : ''}
                    </span>
                  )}
                  <Link
                    href={`/admin/orders/${r.order_id}`}
                    className="inline-flex items-center gap-1 text-sm text-luxe-gold hover:underline ml-auto"
                  >
                    Zur Bestellung
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
