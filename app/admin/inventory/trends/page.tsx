'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Loader2, ArrowLeft, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Recommendation {
  product_id: string
  product_name: string
  current_stock: number
  sold_last_30: number
  expected_demand: number
  order_quantity: number
  cost_eur: number
}

interface EventWithRec {
  id: string
  name: string
  event_month: number
  event_day: number
  expected_growth_factor: number
  notes?: string
  expected_cogs_eur: number
  recommendations: Recommendation[]
}

interface ChartPoint {
  month: string
  monthKey: string
  actual: number
  projected: number | null
  isEvent: boolean
}

interface TrendsData {
  events: EventWithRec[]
  chart_data: ChartPoint[]
  seasonal_expected_cogs_eur: number
}

function formatEur(n: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function eventLabel(ev: EventWithRec): string {
  return `${ev.name} (${String(ev.event_day).padStart(2, '0')}.${String(ev.event_month).padStart(2, '0')})`
}

export default function AdminInventoryTrendsPage() {
  const [data, setData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/inventory/trends')
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2 text-neutral-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        Lade Trend-Analyse…
      </div>
    )
  }

  const events = data?.events ?? []
  const chartData = (data?.chart_data ?? []).map((d) => ({
    ...d,
    Umsatz: d.actual > 0 ? d.actual : null,
    Projektion: d.projected != null && d.projected > 0 ? d.projected : null,
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/inventory"
          className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Lager
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-neutral-600" />
          Seasonal Intelligence
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Kommende Events aus <code className="bg-neutral-100 px-1 rounded">seasonal_events</code>. Empfehlungen basierend auf Verkäufen der letzten 30 Tage × growth_factor → zusätzliche Bestellmenge.
        </p>
      </div>

      {/* Liniendiagramm: Verkaufsspitzen + Projektion */}
      <Card className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-neutral-100">
          <CardTitle className="text-neutral-900 text-lg font-medium flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Umsatz: Vergangenheit & Projektion
          </CardTitle>
          <p className="text-sm text-neutral-500 font-normal">
            Letzte 3 Monate Ist-Umsatz; nächste 3 Monate: erwartete Verkaufsspitzen (basierend auf letzten 30 Tagen und Event-Wachstumsfaktor).
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {chartData.length === 0 ? (
            <p className="text-neutral-500 py-8 text-center">Keine Chart-Daten.</p>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `${v} €`} />
                  <Tooltip
                    formatter={(value: number | undefined) => [value != null ? formatEur(value) : '–', '']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Umsatz" stroke="#94a3b8" strokeWidth={2} name="Umsatz (Ist)" dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="Projektion" stroke="#b45309" strokeWidth={2} strokeDasharray="5 5" name="Projektion (Saison)" dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events & Einkaufsempfehlungen */}
      <Card className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-neutral-100">
          <CardTitle className="text-neutral-900 text-lg font-medium">Kommende Events & Handlungsanweisungen</CardTitle>
          <p className="text-sm text-neutral-500 font-normal">
            Basierend auf Verkäufen der letzten 30 Tage und growth_factor: wie viel zusätzliche Ware du ordern solltest.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <p className="text-neutral-500 p-6">Keine saisonalen Events angelegt. Tabelle <code className="bg-neutral-100 px-1 rounded">seasonal_events</code> befüllen.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {events.map((ev) => (
                <div key={ev.id} className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-neutral-900">{eventLabel(ev)}</span>
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                      ×{ev.expected_growth_factor} Wachstum
                    </span>
                    {ev.expected_cogs_eur > 0 && (
                      <span className="text-xs text-neutral-500">Erwartete Einkaufskosten: {formatEur(ev.expected_cogs_eur)}</span>
                    )}
                  </div>
                  {ev.recommendations.length === 0 ? (
                    <p className="text-sm text-neutral-500">Keine Nachbestellung nötig (Bestand reicht voraussichtlich).</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {ev.recommendations.map((r) => (
                        <li key={r.product_id} className="text-sm text-neutral-700 border-l-2 border-amber-200 pl-3 py-0.5">
                          <strong>Empfehlung:</strong> Für <strong>{ev.name}</strong> zusätzlich <strong>{r.order_quantity} Einheiten</strong> „{r.product_name}“ ordern.
                          {r.cost_eur > 0 && <span className="text-neutral-500 ml-1">(ca. {formatEur(r.cost_eur)} Einkauf)</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabellarische Detail-Übersicht */}
      {events.some((e) => e.recommendations.length > 0) && (
        <Card className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-neutral-100">
            <CardTitle className="text-neutral-900 text-lg font-medium">Empfehlungen im Detail</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-200 hover:bg-transparent">
                  <TableHead className="text-neutral-600 font-medium">Event</TableHead>
                  <TableHead className="text-neutral-600 font-medium">Produkt</TableHead>
                  <TableHead className="text-neutral-600 font-medium text-right">Bestand</TableHead>
                  <TableHead className="text-neutral-600 font-medium text-right">Verkauf (30 T.)</TableHead>
                  <TableHead className="text-neutral-600 font-medium text-right">Erwartete Nachfrage</TableHead>
                  <TableHead className="text-neutral-600 font-medium text-right">Nachbestellen</TableHead>
                  <TableHead className="text-neutral-600 font-medium text-right">Einkauf (€)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.flatMap((ev) =>
                  ev.recommendations.map((r) => (
                    <TableRow key={`${ev.id}-${r.product_id}`} className="border-neutral-200">
                      <TableCell className="font-medium text-neutral-900">{eventLabel(ev)}</TableCell>
                      <TableCell>{r.product_name}</TableCell>
                      <TableCell className="text-right text-neutral-700">{r.current_stock}</TableCell>
                      <TableCell className="text-right text-neutral-700">{r.sold_last_30}</TableCell>
                      <TableCell className="text-right text-neutral-700">{r.expected_demand}</TableCell>
                      <TableCell className="text-right font-medium text-amber-700">{r.order_quantity}</TableCell>
                      <TableCell className="text-right text-neutral-700">{formatEur(r.cost_eur)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
