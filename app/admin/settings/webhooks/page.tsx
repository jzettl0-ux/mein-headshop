'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface WebhookEntry {
  id: string
  payment_id: string | null
  order_number: string | null
  mollie_status: string | null
  request_body: string | null
  created_at: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function AdminWebhooksPage() {
  const [entries, setEntries] = useState<WebhookEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/webhook-log')
      .then((res) => (res.ok ? res.json() : []))
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
          <Activity className="w-7 h-7 text-neutral-600" />
          Webhook-Log (Mollie)
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Letzte Zahlungs-Webhook-Aufrufe von Mollie. Hilfreich bei Zahlungsproblemen.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Letzte Einträge</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-neutral-500 text-sm py-8 text-center">Noch keine Webhook-Aufrufe protokolliert.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeit</TableHead>
                  <TableHead>Payment-ID</TableHead>
                  <TableHead>Bestellnummer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="max-w-[200px]">Body (Auszug)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(e.created_at)}</TableCell>
                    <TableCell className="font-mono text-sm">{e.payment_id ?? '–'}</TableCell>
                    <TableCell>
                      {e.order_number ? (
                        <Link href="/admin/orders" className="text-emerald-600 hover:underline font-mono" title="Bestellungen durchsuchen">
                          {e.order_number}
                        </Link>
                      ) : (
                        '–'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="rounded px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700">
                        {e.mollie_status ?? '–'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-neutral-500" title={e.request_body ?? undefined}>
                      {e.request_body ? `${e.request_body.slice(0, 80)}…` : '–'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
