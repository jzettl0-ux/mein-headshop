'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Loader2, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Offen',
  LABEL_GENERATED: 'Label erstellt',
  IN_TRANSIT: 'Unterwegs',
  INSPECTING: 'Prüfung',
  ACCEPTED: 'Angenommen',
  REJECTED: 'Abgelehnt',
  RETURNED_TO_CUSTOMER: 'Zurück an Kunde',
}

export default function AdminTradeInsPage() {
  const [loading, setLoading] = useState(true)
  const [tradeIns, setTradeIns] = useState<any[]>([])

  const load = () => {
    setLoading(true)
    fetch('/api/admin/trade-in-requests')
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((d) => setTradeIns(d.requests ?? []))
      .catch(() => setTradeIns([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="h-7 w-7 text-luxe-primary" />
          Trade-In Anfragen
        </h1>
        <p className="mt-1 text-luxe-silver">
          Re-Commerce: Kunden verkaufen gebrauchte Geräte gegen Store Credit.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Anfragen</CardTitle>
          <p className="text-sm text-luxe-silver">
            Trade-In Anfragen nach Wareneingangsprüfung bearbeiten und Store Credit gutschreiben.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-luxe-silver" />
            </div>
          ) : tradeIns.length === 0 ? (
            <p className="text-luxe-silver py-8 text-center">Keine Trade-In Anfragen.</p>
          ) : (
            <div className="space-y-4">
              {tradeIns.map((t: any) => (
                <Link
                  key={t.trade_in_id}
                  href={`/admin/recommerce/trade-ins/${t.trade_in_id}`}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray hover:border-luxe-gold/50 transition-colors block"
                >
                  <div>
                    <p className="text-white font-medium">
                      {t.products?.name ?? 'Produkt'} · {Number(t.quoted_value).toFixed(2)} € (angeboten)
                    </p>
                    <p className="text-sm text-luxe-silver mt-1">
                      {t.customer_email && `${t.customer_email} · `}
                      {t.original_asin && `ASIN: ${t.original_asin} · `}
                      {new Date(t.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.status === 'ACCEPTED' ? 'default' : t.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-luxe-silver" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
