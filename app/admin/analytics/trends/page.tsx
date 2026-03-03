'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Loader2, Package, ShoppingCart, Sparkles, Calendar, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const GOLD = '#D4AF37'
const GRAY_200 = '#E5E5E5'
const GRAY_400 = '#A3A3A3'
const GRAY_600 = '#525252'
const GRAY_800 = '#262626'

const COLORS = [
  GOLD,
  '#B8963D',
  '#9A7B2E',
  '#7A6B5E',
  '#6B5B4F',
  GRAY_600,
  GRAY_400,
  '#8B7355',
]

type SeasonalMonth = { month: string; label: string; [key: string]: string | number }
type ProductTrend = {
  product_id: string
  name: string
  last_6_months: { month: string; label: string; sales: number }[]
  growth_rate: number
  trend: 'trending' | 'stable' | 'declining'
}
type Insight = { product_id: string; product_name: string; reason: string }
type ApiData = {
  year: number
  seasonal_data: { month: string; products: Record<string, number> }[]
  top_products: { id: string; name: string; total_sold: number }[]
  product_trends: ProductTrend[]
  insights: Insight[]
}

const currentYear = new Date().getFullYear()

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1)
  return d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
}

export default function AdminAnalyticsTrendsPage() {
  const [data, setData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/analytics/trends?year=${selectedYear}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [selectedYear])

  useEffect(() => {
    if (data && data.product_trends.length > 0 && !selectedProductId) {
      setSelectedProductId(data.product_trends[0].product_id)
    }
  }, [data, selectedProductId])

  const seasonalChartData = useMemo(() => {
    if (!data) return []
    return data.seasonal_data.map((row) => {
      const obj: SeasonalMonth = { month: row.month, label: formatMonthLabel(row.month) }
      for (const p of data.top_products) {
        obj[p.name] = row.products[p.id] ?? 0
      }
      return obj
    })
  }, [data])

  const kpiStats = useMemo(() => {
    if (!data) return null
    const totalSold = data.top_products.reduce((s, p) => s + p.total_sold, 0)
    let topMonth = { label: '—', value: 0 }
    for (const row of seasonalChartData) {
      const monthTotal = data.top_products.reduce((s, p) => s + (Number(row[p.name]) || 0), 0)
      if (monthTotal > topMonth.value) {
        topMonth = { label: String(row.label), value: monthTotal }
      }
    }
    const trendingCount = data.product_trends.filter((t) => t.trend === 'trending').length
    const decliningCount = data.product_trends.filter((t) => t.trend === 'declining').length
    return { totalSold, topMonth, trendingCount, decliningCount }
  }, [data, seasonalChartData])

  const selectedTrend = useMemo(() => {
    if (!data || !selectedProductId) return null
    return data.product_trends.find((t) => t.product_id === selectedProductId)
  }, [data, selectedProductId])

  const TrendIcon = ({ trend }: { trend: 'trending' | 'stable' | 'declining' }) => {
    if (trend === 'trending')
      return <TrendingUp className="w-4 h-4 text-luxe-gold" strokeWidth={2.5} />
    if (trend === 'declining')
      return <TrendingDown className="w-4 h-4 text-luxe-silver" strokeWidth={2} />
    return <Minus className="w-4 h-4 text-white/50" strokeWidth={2} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <p className="text-luxe-silver">Keine Trend-Daten oder Berechtigung.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxe-black">
      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-luxe-gold" strokeWidth={1.5} />
              Saisonale Trends
            </h1>
            <p className="text-luxe-silver text-sm mt-1">
              Saisonale Muster, Produkttrends und Einkaufs-Empfehlungen.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="year" className="text-sm font-medium text-white/80">Jahr</label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="rounded-lg border border-luxe-gray bg-luxe-charcoal px-4 py-2.5 text-sm font-medium text-white focus:ring-2 focus:ring-luxe-gold/50 focus:border-luxe-gold"
            >
              {Array.from({ length: 6 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI-Karten */}
        {kpiStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-4 rounded-xl bg-luxe-charcoal border border-luxe-gray p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-luxe-gold/20">
                <Package className="h-6 w-6 text-luxe-gold" />
              </div>
              <div>
                <p className="text-xs font-medium text-luxe-silver uppercase tracking-wider">Gesamt-Verkäufe</p>
                <p className="text-xl font-bold text-white">{kpiStats.totalSold.toLocaleString('de-DE')}</p>
                <p className="text-xs text-luxe-silver">Stück in {selectedYear}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-luxe-charcoal border border-luxe-gray p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-luxe-gold/20">
                <Calendar className="h-6 w-6 text-luxe-gold" />
              </div>
              <div>
                <p className="text-xs font-medium text-luxe-silver uppercase tracking-wider">Stärkster Monat</p>
                <p className="text-xl font-bold text-white">{kpiStats.topMonth.label}</p>
                <p className="text-xs text-luxe-silver">{kpiStats.topMonth.value.toLocaleString('de-DE')} Stück</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-luxe-charcoal border border-luxe-gray p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-luxe-gold/20">
                <TrendingUp className="h-6 w-6 text-luxe-gold" />
              </div>
              <div>
                <p className="text-xs font-medium text-luxe-silver uppercase tracking-wider">Trending</p>
                <p className="text-xl font-bold text-white">{kpiStats.trendingCount}</p>
                <p className="text-xs text-luxe-silver">Produkte im Aufwärtstrend</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-luxe-charcoal border border-luxe-gray p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-luxe-gold/20">
                <Target className="h-6 w-6 text-luxe-gold" />
              </div>
              <div>
                <p className="text-xs font-medium text-luxe-silver uppercase tracking-wider">Empfehlungen</p>
                <p className="text-xl font-bold text-white">{data.insights.length}</p>
                <p className="text-xs text-luxe-silver">Einkaufshinweise</p>
              </div>
            </div>
          </div>
        )}

        {/* 1. Saisonal-Übersicht – kompakte KPI + Chart */}
        <section>
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Saisonal-Übersicht</CardTitle>
              <p className="text-sm text-luxe-silver mt-0.5">
                Verkäufe der Top-Produkte über die 12 Monate – schnell erkennen, welches Produkt wann boomt.
              </p>
            </CardHeader>
            <CardContent>
              {seasonalChartData.length === 0 || data.top_products.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-luxe-silver text-sm rounded-lg border border-luxe-gray/50 border-dashed">
                  Keine Verkaufsdaten für {selectedYear}.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {data.top_products.map((p, i) => (
                      <div
                        key={p.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-luxe-gray/30 border border-luxe-gray/50"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-sm text-white font-medium truncate max-w-[120px]">{p.name}</span>
                        <span className="text-xs text-luxe-gold font-semibold tabular-nums">{p.total_sold}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={seasonalChartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRAY_600} vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                          axisLine={{ stroke: GRAY_600 }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => v.toString()}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1A1A1A',
                            border: '1px solid #2A2A2A',
                            borderRadius: 8,
                            color: '#fff',
                          }}
                          labelStyle={{ color: '#fff' }}
                          formatter={(value: number | undefined) => [value ?? 0, '']}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" iconSize={10} />
                        {data.top_products.map((p, i) => (
                          <Bar
                            key={p.id}
                            dataKey={p.name}
                            stackId="a"
                            fill={COLORS[i % COLORS.length]}
                            radius={[0, 0, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* 2. Produkt-Trend-Analyse */}
        <section>
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white text-lg">Produkt-Trend-Analyse</CardTitle>
              <p className="text-sm text-luxe-silver mt-0.5">
                Verkaufsverlauf der letzten 6 Monate und Wachstumsrate zum Vormonat.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-luxe-silver">Produkt wählen</h3>
                  {data.product_trends.length === 0 ? (
                    <p className="text-luxe-silver text-sm">Keine Produkte mit Verkäufen in den letzten 6 Monaten.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.product_trends.map((t) => (
                        <button
                          key={t.product_id}
                          onClick={() => setSelectedProductId(t.product_id)}
                          className={`w-full flex items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                            selectedProductId === t.product_id
                              ? 'bg-luxe-gold/20 border border-luxe-gold/50 text-white'
                              : 'hover:bg-luxe-gray/50 border border-transparent text-white/80'
                          }`}
                        >
                          <span className="truncate font-medium">{t.name}</span>
                          <TrendIcon trend={t.trend} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="lg:col-span-2">
                  {selectedTrend ? (
                    <div className="rounded-lg border border-luxe-gray p-6 bg-luxe-black/50">
                      <div className="flex items-center justify-between gap-4 mb-6">
                        <div>
                          <h3 className="font-semibold text-white">{selectedTrend.name}</h3>
                          <p className="text-xs text-luxe-silver mt-0.5">
                            Wachstum zum Vormonat: <span className="text-luxe-gold font-semibold">{(selectedTrend.growth_rate * 100).toFixed(0)}%</span>
                            {selectedTrend.trend === 'trending' && ' · Trending'}
                            {selectedTrend.trend === 'declining' && ' · Rückläufig'}
                            {selectedTrend.trend === 'stable' && ' · Stabil'}
                          </p>
                        </div>
                        <TrendIcon trend={selectedTrend.trend} />
                      </div>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedTrend.last_6_months} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={GRAY_600} vertical={false} />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                              axisLine={{ stroke: GRAY_600 }}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1A1A1A',
                                border: '1px solid #2A2A2A',
                                borderRadius: 8,
                                color: '#fff',
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="sales"
                              name="Verkäufe"
                              stroke={GOLD}
                              strokeWidth={2}
                              dot={{ r: 4, fill: GOLD, strokeWidth: 0 }}
                              activeDot={{ r: 6, fill: GOLD, stroke: '#1A1A1A', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="h-56 flex items-center justify-center text-luxe-silver text-sm rounded-lg border border-luxe-gray/50 border-dashed">
                      Produkt auswählen
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. Einkaufs-Empfehlungen */}
        <section>
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-luxe-gold" />
                Einkaufs-Empfehlung
              </CardTitle>
              <p className="text-sm text-luxe-silver mt-0.5">
                Produkte mit positivem Trend, deren Saison bevorsteht – rechtzeitig nachbestellen.
              </p>
            </CardHeader>
            <CardContent>
              {data.insights.length === 0 ? (
                <p className="text-luxe-silver text-sm py-6 rounded-lg border border-luxe-gray/50 border-dashed text-center">
                  Aktuell keine konkreten Empfehlungen. Produkte mit steigendem Trend und bevorstehender Saison erscheinen hier.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.insights.map((ins) => (
                    <div
                      key={ins.product_id}
                      className="flex gap-4 p-4 rounded-lg bg-luxe-gold/10 border border-luxe-gold/30"
                    >
                      <Package className="w-5 h-5 text-luxe-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">{ins.product_name}</p>
                        <p className="text-sm text-luxe-silver mt-1">{ins.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
