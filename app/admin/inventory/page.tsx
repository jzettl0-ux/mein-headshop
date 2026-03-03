'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Loader2, AlertTriangle, AlertCircle, TrendingUp, ExternalLink, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'

interface InventoryRow {
  id: string
  name: string
  slug: string
  stock: number
  min_stock_level: number
  sold_last_30_days: number
  avg_sales_per_day: number
  days_until_empty: number | null
  warning: 'red' | 'yellow' | null
  price?: number
  effective_price?: number
  has_discount?: boolean
}

interface SeasonalSummary {
  next_event?: { name: string; event_month: number; event_day: number; expected_cogs_eur: number }
  total_recommended_cogs?: number
}

export default function AdminInventoryPage() {
  const [data, setData] = useState<{ items: InventoryRow[] } | null>(null)
  const [seasonal, setSeasonal] = useState<SeasonalSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/inventory/intelligence')
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/admin/inventory/trends')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const events = json?.events ?? []
        const next = events.find((e: { expected_cogs_eur?: number }) => (e.expected_cogs_eur ?? 0) > 0)
        const total = events.reduce((s: number, e: { expected_cogs_eur?: number }) => s + (e.expected_cogs_eur ?? 0), 0)
        setSeasonal({
          next_event: next
            ? {
                name: next.name,
                event_month: next.event_month,
                event_day: next.event_day,
                expected_cogs_eur: next.expected_cogs_eur ?? 0,
              }
            : undefined,
          total_recommended_cogs: total > 0 ? total : undefined,
        })
      })
      .catch(() => setSeasonal(null))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2 text-neutral-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        Lade Lager-Vorhersage…
      </div>
    )
  }

  const items = data?.items ?? []
  const withWarning = items.filter((i) => i.warning)
  const redCount = items.filter((i) => i.warning === 'red').length
  const yellowCount = items.filter((i) => i.warning === 'yellow').length

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-neutral-600" />
            Inventory Intelligence
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Lager-Vorhersage: Durchschnittsverkauf der letzten 30 Tage und geschätzte Tage bis Ausverkauf.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/inventory/wareneingang"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-200 rounded-lg px-3 py-2 bg-white"
          >
            <Package className="w-4 h-4" />
            Wareneingang
          </Link>
          <Link
            href="/admin/inventory/trends"
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 border border-amber-200 rounded-lg px-3 py-2 bg-amber-50/50"
          >
            <TrendingUp className="w-4 h-4" />
            Saison-Trends & Einkaufsempfehlungen
          </Link>
        </div>
      </div>

      {/* Saison-Empfehlungen (seasonal_events): Bestands-Peaks für Events wie 4/20 */}
      {(seasonal?.next_event ?? seasonal?.total_recommended_cogs) && (
        <Card className="bg-white border border-amber-200 shadow-sm">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">Saison-Empfehlung</p>
                <p className="text-sm text-neutral-600">
                  {seasonal.next_event
                    ? `Nächstes Event: ${seasonal.next_event.name} (${String(seasonal.next_event.event_day).padStart(2, '0')}.${String(seasonal.next_event.event_month).padStart(2, '0')}) – empfohlener Einkauf für Bestands-Peak: ${(seasonal.next_event.expected_cogs_eur ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`
                    : 'Einkaufsempfehlungen basierend auf Verkäufen der letzten 30 Tage × growth_factor (seasonal_events).'}
                </p>
                {seasonal.total_recommended_cogs != null && seasonal.total_recommended_cogs > 0 && (
                  <p className="text-xs text-neutral-500 mt-1">Gesamt empfohlener Einkauf (alle Events): {seasonal.total_recommended_cogs.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</p>
                )}
              </div>
            </div>
            <Link
              href="/admin/inventory/trends"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800"
            >
              Alle Trends anzeigen
              <ExternalLink className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      {(redCount > 0 || yellowCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {redCount > 0 && (
            <Card className="bg-white border border-red-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-800">Unter Mindestbestand</p>
                  <p className="text-sm text-red-600">{redCount} Produkt(e)</p>
                </div>
              </CardContent>
            </Card>
          )}
          {yellowCount > 0 && (
            <Card className="bg-white border border-amber-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-800">In &lt; 7 Tagen leer</p>
                  <p className="text-sm text-amber-600">{yellowCount} Produkt(e)</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-neutral-100">
          <CardTitle className="text-neutral-900 text-lg font-medium">Lager & Vorhersage</CardTitle>
          <p className="text-sm text-neutral-500 font-normal">
            Gelb = voraussichtlich in unter 7 Tagen ausverkauft. Rot = Bestand unter Mindestbestand (min_stock_level).
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-200 hover:bg-transparent">
                <TableHead className="text-neutral-600 font-medium">Produkt</TableHead>
                <TableHead className="text-neutral-600 font-medium text-right">Preis</TableHead>
                <TableHead className="text-neutral-600 font-medium text-right">Bestand</TableHead>
                <TableHead className="text-neutral-600 font-medium text-right">Min.</TableHead>
                <TableHead className="text-neutral-600 font-medium text-right">Verkauf (30 T.)</TableHead>
                <TableHead className="text-neutral-600 font-medium text-right">Ø / Tag</TableHead>
                <TableHead className="text-neutral-600 font-medium text-right">Tage bis leer</TableHead>
                <TableHead className="text-neutral-600 font-medium w-[100px]">Status</TableHead>
                <TableHead className="text-neutral-600 font-medium w-[120px]">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-neutral-500 py-8">
                    Keine Produkte gefunden.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow
                    key={row.id}
                    className={
                      row.warning === 'red'
                        ? 'bg-red-50/50 border-neutral-200'
                        : row.warning === 'yellow'
                          ? 'bg-amber-50/50 border-neutral-200'
                          : 'border-neutral-200'
                    }
                  >
                    <TableCell className="font-medium text-neutral-900">
                      <Link
                        href={`/admin/products/${row.id}/edit`}
                        className="text-neutral-900 hover:text-amber-700 hover:underline"
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-neutral-700 whitespace-nowrap">
                      {row.effective_price != null ? (
                        row.has_discount && row.price != null && row.price > row.effective_price ? (
                          <span>
                            <span className="line-through text-neutral-400 text-sm mr-1.5">{formatPrice(row.price)}</span>
                            <span className="font-medium text-amber-700">{formatPrice(row.effective_price)}</span>
                          </span>
                        ) : (
                          formatPrice(row.effective_price)
                        )
                      ) : (
                        row.price != null ? formatPrice(row.price) : '–'
                      )}
                    </TableCell>
                    <TableCell className="text-right text-neutral-700">{row.stock}</TableCell>
                    <TableCell className="text-right text-neutral-600">{row.min_stock_level}</TableCell>
                    <TableCell className="text-right text-neutral-700">{row.sold_last_30_days}</TableCell>
                    <TableCell className="text-right text-neutral-700">{row.avg_sales_per_day.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-neutral-700">
                      {row.days_until_empty == null ? '–' : row.days_until_empty >= 999 ? '∞' : row.days_until_empty}
                    </TableCell>
                    <TableCell>
                      {row.warning === 'red' && (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                          Unter Min.
                        </Badge>
                      )}
                      {row.warning === 'yellow' && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          &lt; 7 Tage
                        </Badge>
                      )}
                      {!row.warning && row.stock > 0 && (
                        <span className="text-xs text-neutral-500">OK</span>
                      )}
                      {!row.warning && row.stock === 0 && (
                        <Badge variant="secondary">Leer</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/products/${row.id}/edit`}
                        className="inline-flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-800 font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Zum Produkt / nachbestellen
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
