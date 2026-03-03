'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Package, Loader2, Medal, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface ProductSaleRow {
  product_id: string | null
  product_name: string
  total_quantity_sold: number
  order_count: number
  rank: number
}

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Gesamter Zeitraum' },
  { value: '7d', label: 'Letzte 7 Tage' },
  { value: '30d', label: 'Letzte 30 Tage' },
  { value: '90d', label: 'Letzte 90 Tage' },
  { value: 'month', label: 'Dieser Monat' },
  { value: 'last_month', label: 'Vorgänger-Monat' },
  { value: 'year', label: 'Dieses Jahr' },
] as const

export default function AdminSalesPage() {
  const [items, setItems] = useState<ProductSaleRow[]>([])
  const [period, setPeriod] = useState<string>('all')
  const [periodLabel, setPeriodLabel] = useState<string>('Gesamter Zeitraum')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/analytics/product-sales?period=${encodeURIComponent(period)}`)
      .then((res) => (res.ok ? res.json() : { items: [], period_label: PERIOD_OPTIONS.find((p) => p.value === period)?.label }))
      .then((data: { items?: ProductSaleRow[]; period_label?: string }) => {
        setItems(data.items ?? [])
        if (data.period_label) setPeriodLabel(data.period_label)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [period])

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/30 text-amber-400 font-bold border border-amber-500/50">1</span>
    if (rank === 2) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-luxe-silver/30 text-luxe-silver font-bold border border-luxe-silver/50">2</span>
    if (rank === 3) return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/30 text-amber-600 font-bold border border-amber-700/50">3</span>
    return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-luxe-gray text-luxe-silver text-sm font-medium">{rank}</span>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-luxe-gold" />
          Verkaufsübersicht
        </h1>
        <p className="text-luxe-silver">
          Wie oft sich welches Produkt verkauft hat und Bestplatzierung nach Zeitraum (nur nicht stornierte Bestellungen).
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Medal className="w-5 h-5 text-luxe-gold" />
                Verkaufte Mengen & Bestplatzierung
              </CardTitle>
              <p className="text-sm text-luxe-silver mt-1">
                Sortiert nach verkaufter Stückzahl. Platz 1–3 hervorgehoben.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-luxe-silver" />
              <select
                value={period}
                onChange={(e) => {
                  const v = e.target.value
                  setPeriod(v)
                  const opt = PERIOD_OPTIONS.find((p) => p.value === v)
                  if (opt) setPeriodLabel(opt.label)
                }}
                className="px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm min-w-[180px]"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-luxe-silver/80 mt-2">
            Zeitraum: <strong className="text-luxe-gold">{periodLabel}</strong>
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-luxe-silver">
              <Loader2 className="w-6 h-6 animate-spin" />
              Lade Verkäufe…
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-luxe-silver">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{period === 'all' ? 'Noch keine Verkäufe oder keine nicht stornierten Bestellungen.' : `Im gewählten Zeitraum (${periodLabel}) keine Verkäufe.`}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-luxe-gray">
                    <th className="pb-3 pr-4 text-luxe-silver font-medium">Platz</th>
                    <th className="pb-3 pr-4 text-luxe-silver font-medium">Produkt</th>
                    <th className="pb-3 pr-4 text-luxe-silver font-medium text-right">Verkaufte Menge</th>
                    <th className="pb-3 text-luxe-silver font-medium text-right">Anzahl Bestellungen</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.product_id || row.product_name} className="border-b border-luxe-gray/70 hover:bg-luxe-gray/30">
                      <td className="py-3 pr-4">{getRankBadge(row.rank)}</td>
                      <td className="py-3 pr-4">
                        {row.product_id ? (
                          <Link
                            href={`/admin/products/${row.product_id}/edit`}
                            className="text-white hover:text-luxe-gold transition-colors"
                          >
                            {row.product_name}
                          </Link>
                        ) : (
                          <span className="text-white">{row.product_name}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium text-luxe-gold">
                        {row.total_quantity_sold} Stück
                      </td>
                      <td className="py-3 text-right text-luxe-silver">
                        {row.order_count} Bestellung{row.order_count !== 1 ? 'en' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
