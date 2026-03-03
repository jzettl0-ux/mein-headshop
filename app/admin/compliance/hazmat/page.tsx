'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Loader2, Battery, Flame, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type HazmatItem = {
  hazmat_id: string
  product_id: string | null
  vendor_id: string
  contains_batteries: boolean
  battery_type: string | null
  is_flammable_liquid: boolean
  un_number: string | null
  safety_data_sheet_url: string | null
  approval_status: string
  updated_at: string
  product_name: string
  product_slug: string | null
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Prüfung ausstehend',
  APPROVED_STANDARD: 'Freigegeben (Standard)',
  APPROVED_HAZMAT: 'Freigegeben (Gefahrgut)',
  REJECTED: 'Abgelehnt',
}

export default function AdminHazmatPage() {
  const [items, setItems] = useState<HazmatItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/hazmat')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'APPROVED_STANDARD' || status === 'APPROVED_HAZMAT') return <CheckCircle className="h-4 w-4 text-emerald-500" />
    if (status === 'REJECTED') return <XCircle className="h-4 w-4 text-red-500" />
    return <Clock className="h-4 w-4 text-amber-500" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-luxe-gold" />
          Gefahrgut (Hazmat) & Produktsicherheit
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Vaporizer (Akkus), Reinigungsmittel – Katalog-Quarantäne DANGEROUS_GOOD_PENDING bis SDS/Freistellung vorhanden.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : items.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Gefahrgut-Einträge. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">compliance_hazmat.product_safety_data</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Produkte mit Sicherheitsdaten</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{items.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {items.map((i) => (
                <li
                  key={i.hazmat_id}
                  className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-luxe-gold/10">
                      {i.contains_batteries ? (
                        <Battery className="h-4 w-4 text-luxe-gold" />
                      ) : i.is_flammable_liquid ? (
                        <Flame className="h-4 w-4 text-amber-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-luxe-gold" />
                      )}
                    </span>
                    <div>
                      <Link
                        href={i.product_id ? `/admin/products/${i.product_id}/edit` : '#'}
                        className="text-luxe-gold hover:underline font-medium"
                      >
                        {i.product_name || i.product_id || '–'}
                      </Link>
                      <p className="text-luxe-silver text-xs mt-0.5">
                        {i.contains_batteries && `Akkus: ${i.battery_type ?? '–'}`}
                        {i.contains_batteries && i.is_flammable_liquid && ' · '}
                        {i.is_flammable_liquid && 'Brennbar'}
                        {i.un_number && ` · UN ${i.un_number}`}
                        {i.safety_data_sheet_url && (
                          <a href={i.safety_data_sheet_url} target="_blank" rel="noopener noreferrer" className="text-luxe-gold hover:underline ml-1">
                            SDS
                          </a>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-luxe-silver">
                    <StatusIcon status={i.approval_status} />
                    {STATUS_LABELS[i.approval_status] ?? i.approval_status}
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
