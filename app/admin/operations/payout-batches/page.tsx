'use client'

import { useState, useEffect } from 'react'
import { Banknote, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Batch = {
  batch_id: string
  vendor_id: string
  vendor_name: string
  period_start: string
  period_end: string
  gross_sales: number
  total_fees: number
  net_payout: number
  payout_status: string
  bank_reference?: string | null
  created_at: string
}

const statusLabel: Record<string, string> = {
  PROCESSING: 'In Bearbeitung',
  PAID: 'Ausgezahlt',
  FAILED: 'Fehlgeschlagen',
}

export default function AdminPayoutBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/payout-batches')
      .then((r) => (r.ok ? r.json() : { batches: [] }))
      .then((d) => setBatches(d.batches ?? []))
      .catch(() => setBatches([]))
      .finally(() => setLoading(false))
  }, [])

  const formatEur = (n: number) => Number(n).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Banknote className="w-6 h-6 text-luxe-gold" />
          Payout Batches
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Auszahlungsbatches pro Vendor (Zeitraum, Brutto, Gebühren, Netto). Status: In Bearbeitung / Ausgezahlt.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : batches.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Batches. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">deep_tech.payout_batches</code> wird von Abrechnungs-Jobs befüllt.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Batches ({batches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {batches.map((b) => (
                <li
                  key={b.batch_id}
                  className="flex flex-wrap items-center gap-3 py-3 border-b border-luxe-gray/50 last:border-0"
                >
                  <span className="text-white text-sm font-medium truncate max-w-[180px]" title={b.vendor_name}>
                    {b.vendor_name}
                  </span>
                  <span className="text-luxe-silver text-sm">
                    {new Date(b.period_start).toLocaleDateString('de-DE')} – {new Date(b.period_end).toLocaleDateString('de-DE')}
                  </span>
                  <span className="text-luxe-silver text-sm">Brutto: {formatEur(b.gross_sales)}</span>
                  <span className="text-luxe-silver text-sm">Netto: {formatEur(b.net_payout)}</span>
                  <Badge
                    variant="secondary"
                    className={
                      b.payout_status === 'PAID'
                        ? 'bg-green-900/50 text-green-200'
                        : b.payout_status === 'FAILED'
                          ? 'bg-red-900/50 text-red-200'
                          : 'bg-luxe-gray text-luxe-silver'
                    }
                  >
                    {statusLabel[b.payout_status] ?? b.payout_status}
                  </Badge>
                  {b.bank_reference && (
                    <span className="text-luxe-silver/70 text-xs">Ref: {b.bank_reference}</span>
                  )}
                  <span className="text-luxe-silver/70 text-xs ml-auto">
                    {new Date(b.created_at).toLocaleDateString('de-DE')}
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
