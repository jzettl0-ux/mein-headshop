'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Banknote, Loader2, Package, TrendingUp, FileDown, Settings, AlertTriangle, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface CashflowMonth {
  month: string
  income: number
  expenses: number
  expenses_orders?: number
  expenses_manual?: number
  profit: number
}

interface TaxSummary {
  total_income: number
  total_expenses: number
  actual_profit: number
  reserve_30_percent: number
  available_capital?: number
}

interface OverviewData {
  stock_value: number
  cashflow: CashflowMonth[]
  tax_summary: TaxSummary
  revenue_ytd?: number
  revenue_limit?: number
  seasonal_expected_cogs_eur?: number
}

interface SelfBillingItem {
  invoice_id: string
  invoice_number: string
  order_id: string
  vendor_id: string
  net_amount: number
  gross_amount: number
  issued_date: string
  created_at: string
  e_invoice_xml_url?: string | null
}

function formatEur(n: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-')
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1)
  return d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
}

const REVENUE_LIMIT_DEFAULT = 22_500
const WARN_GOLD = 18_000
const WARN_RED = 21_000

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => currentYear - i)

export default function AdminFinancesPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selfBilling, setSelfBilling] = useState<SelfBillingItem[]>([])

  const loadOverview = () => {
    setLoading(true)
    fetch(`/api/admin/finances/overview?year=${selectedYear}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOverview()
  }, [selectedYear])

  useEffect(() => {
    fetch('/api/admin/finances/self-billing?limit=5')
      .then((r) => (r.ok ? r.json() : []))
      .then(setSelfBilling)
      .catch(() => setSelfBilling([]))
  }, [])

  const downloadTaxPdf = (month?: string) => {
    setPdfLoading(true)
    const url = month
      ? `/api/admin/finances/tax-pdf?month=${encodeURIComponent(month)}`
      : '/api/admin/finances/tax-pdf'
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error('PDF konnte nicht erstellt werden')
        const disposition = res.headers.get('Content-Disposition') || ''
        const blob = await res.blob()
        const filename = disposition.match(/filename="(.+)"/)?.[1] || 'Steuer-Monatsuebersicht.pdf'
        return { blob, filename }
      })
      .then(({ blob, filename }) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = filename
        a.click()
        URL.revokeObjectURL(a.href)
      })
      .catch(() => {})
      .finally(() => setPdfLoading(false))
  }

  const downloadCsv = () => {
    const url = `/api/admin/finances/export-csv?year=${selectedYear}`
    const a = document.createElement('a')
    a.href = url
    a.download = `Finanzamt-Export-${selectedYear}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2 text-luxe-silver">
        <Loader2 className="w-6 h-6 animate-spin text-luxe-gold" />
        Lade Finanzübersicht…
      </div>
    )
  }

  const tax = data?.tax_summary
  const revenueYtd = data?.revenue_ytd ?? 0
  const revenueLimit = data?.revenue_limit ?? REVENUE_LIMIT_DEFAULT
  const progressPct = Math.min(100, (revenueYtd / revenueLimit) * 100)
  const isGold = revenueYtd >= WARN_GOLD
  const isRed = revenueYtd >= WARN_RED

  const chartData = (data?.cashflow || []).map((c) => ({
    name: formatMonthLabel(c.month),
    Einnahmen: c.income,
    Ausgaben: c.expenses,
    Gewinn: c.profit,
  }))

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-luxe-gold" />
            Finanz-Dashboard
          </h1>
          <p className="text-luxe-silver text-sm">
            Verfügbares Kapital, Steuer-Reserve, Lagerwert und Kleinunternehmer-Umsatz.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="year-filter" className="text-sm font-medium text-white/80">Jahr</label>
            <select
              id="year-filter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="rounded-lg border border-luxe-gray bg-luxe-charcoal px-4 py-2.5 text-sm font-medium text-white focus:ring-2 focus:ring-luxe-gold/50 focus:border-luxe-gold"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <Link href="/admin/settings/finances">
            <Button variant="admin-outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Finanz-Parameter
            </Button>
          </Link>
          <Button
            variant="admin-outline"
            size="sm"
            onClick={downloadCsv}
          >
            <FileDown className="w-4 h-4 mr-2" />
            CSV Export {selectedYear}
          </Button>
          <a
            href={`/api/admin/datev/export?year=${selectedYear}`}
            download={`DATEV-Export-${selectedYear}.csv`}
            className="inline-flex items-center justify-center rounded-md border-2 border-luxe-gold text-luxe-gold bg-transparent px-3 py-2 text-sm font-medium hover:bg-luxe-gold/10 transition-colors"
          >
            <FileDown className="w-4 h-4 mr-2" />
            DATEV Export {selectedYear}
          </a>
          <Button
            variant="admin-outline"
            size="sm"
            disabled={pdfLoading}
            onClick={() => downloadTaxPdf()}
          >
            {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
            Steuer-PDF
          </Button>
          <a
            href={`/api/admin/finances/oss-export?from=${selectedYear}-01-01&to=${selectedYear}-12-31&format=csv`}
            className="inline-flex items-center justify-center rounded-md border border-luxe-gray text-luxe-silver px-3 py-2 text-sm hover:bg-luxe-gray/50 transition-colors"
          >
            <FileDown className="w-4 h-4 mr-2" />
            OSS-Export {selectedYear}
          </a>
        </div>
      </div>

      {/* Drei Kacheln: Verfügbares Kapital, Steuer-Reserve, Lagerwert */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-6">
            <p className="text-xs font-medium text-luxe-silver uppercase tracking-wider mb-1">Verfügbares Kapital</p>
            <p className="text-2xl font-bold text-white">
              {tax?.available_capital != null ? formatEur(tax.available_capital) : '—'}
            </p>
            <p className="text-xs text-luxe-silver mt-1">
              Umsatz − Einkauf − Gebühren − Steuerrücklage
            </p>
          </CardContent>
        </Card>
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-6">
            <p className="text-xs font-medium text-luxe-silver uppercase tracking-wider mb-1">Steuer-Reserve</p>
            <p className="text-2xl font-bold text-amber-400">
              {tax ? formatEur(tax.reserve_30_percent) : '—'}
            </p>
            <p className="text-xs text-luxe-silver mt-1">
              Unantastbar: 30 % vom Gewinn – auch bei Prognosen und saisonalen Spitzen nicht anrühren.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-luxe-gold/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-luxe-gold" />
            </div>
            <div>
              <p className="text-xs font-medium text-luxe-silver uppercase tracking-wider mb-1">Lagerwert</p>
              <p className="text-2xl font-bold text-white">
                {data ? formatEur(data.stock_value) : '—'}
              </p>
              <p className="text-xs text-luxe-silver mt-1">Einkaufspreis × Bestand</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Umsatz-Warnung Kleinunternehmer */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white text-lg">Umsatz Kleinunternehmer-Regelung</CardTitle>
          <p className="text-sm text-luxe-silver">
            Limit {formatEur(revenueLimit)} ({selectedYear}). Ab 18.000 € wird der Balken hervorgehoben; ab 21.000 € bitte Steuerberater kontaktieren.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-luxe-silver">Umsatz {selectedYear}</span>
            <span className="font-semibold text-white">{formatEur(revenueYtd)}</span>
          </div>
          <div className="h-3 bg-luxe-gray/50 rounded-full overflow-hidden border border-luxe-gray">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                backgroundColor: isRed ? '#dc2626' : isGold ? '#D4AF37' : '#22c55e',
              }}
            />
          </div>
          {isRed && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="font-medium">ACHTUNG: Limit fast erreicht. Steuerberater kontaktieren!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BWA – Betriebswirtschaftliche Auswertung (monatliche Tabelle) */}
      <Card className="bg-luxe-charcoal border-luxe-gray overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white text-lg font-medium">BWA – Betriebswirtschaftliche Auswertung</CardTitle>
          <p className="text-sm text-luxe-silver">
            Monatliche Gegenüberstellung Einnahmen vs. Ausgaben für {selectedYear} (aus Bestellungen + Ausgaben). Saldo = Einnahmen − Ausgaben.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {(data?.cashflow?.length ?? 0) === 0 ? (
            <p className="text-luxe-silver py-8 text-center">Keine Daten für {selectedYear}.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-luxe-gray bg-luxe-black/50">
                    <th className="text-left font-semibold text-luxe-silver py-3 px-4">Monat</th>
                    <th className="text-right font-semibold text-luxe-silver py-3 px-4">Einnahmen</th>
                    <th className="text-right font-semibold text-luxe-silver py-3 px-4">Ausgaben</th>
                    <th className="text-right font-semibold text-luxe-silver py-3 px-4">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.cashflow ?? []).map((row) => (
                    <tr key={row.month} className="border-b border-luxe-gray/50 hover:bg-luxe-gray/20">
                      <td className="py-3 px-4 font-medium text-white">{formatMonthLabel(row.month)}</td>
                      <td className="text-right py-3 px-4 text-emerald-400">{formatEur(row.income)}</td>
                      <td className="text-right py-3 px-4 text-red-400">{formatEur(row.expenses)}</td>
                      <td className={`text-right py-3 px-4 font-medium ${row.profit >= 0 ? 'text-white' : 'text-red-400'}`}>
                        {formatEur(row.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Einnahmen vs. Ausgaben – Recharts */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-luxe-gold" />
            Einnahmen vs. Ausgaben ({selectedYear})
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Grüne Balken = Einnahmen, rote = Ausgaben (Wareneinsatz + Gebühren + manuelle Ausgaben).
          </p>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-luxe-silver py-8 text-center">Keine Daten für {selectedYear}.</p>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} axisLine={{ stroke: '#404040' }} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} tickFormatter={(v) => `${v} €`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number | undefined) => [value != null ? formatEur(value) : '–', '']}
                    labelFormatter={(label) => label}
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Einnahmen" fill="#22c55e" name="Einnahmen" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Ausgaben" fill="#dc2626" name="Ausgaben" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cashflow-Prognose: Kapital für saisonalen Wareneinkauf */}
      {(data?.seasonal_expected_cogs_eur ?? 0) > 0 && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base font-medium">Cashflow-Prognose</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">
              Wie viel Kapital für den saisonalen Wareneinkauf benötigt wird (basierend auf Verkäufen der letzten 30 Tage × growth_factor). Die Steuer-Reserve bleibt davon unberührt und unantastbar.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-lg font-semibold text-white">Benötigtes Kapital (Einkauf): <span className="text-luxe-gold">{formatEur(data!.seasonal_expected_cogs_eur!)}</span></p>
            <Link href="/admin/inventory/trends" className="text-sm text-luxe-gold hover:text-luxe-gold/90 font-medium">
              Seasonal Intelligence →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Self-Billing Gutschriften §14 UStG */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-luxe-gold" />
            Self-Billing Gutschriften (§14 UStG)
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Automatisch erzeugt bei bezahlten Bestellungen mit Vendor-Anteil. Sequenzielle Nummern SB-YYYY-NNNNNN.
          </p>
        </CardHeader>
        <CardContent>
          {selfBilling.length === 0 ? (
            <p className="text-luxe-silver text-sm">Noch keine Self-Billing Gutschriften.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-luxe-gray">
                    <th className="text-left font-semibold text-luxe-silver py-2 px-3">Gutschrift-Nr.</th>
                    <th className="text-left font-semibold text-luxe-silver py-2 px-3">Bestellung</th>
                    <th className="text-right font-semibold text-luxe-silver py-2 px-3">Brutto</th>
                    <th className="text-left font-semibold text-luxe-silver py-2 px-3">Datum</th>
                    <th className="text-left font-semibold text-luxe-silver py-2 px-3">XRechnung</th>
                  </tr>
                </thead>
                <tbody>
                  {selfBilling.map((sb) => (
                    <tr key={sb.invoice_id} className="border-b border-luxe-gray/50">
                      <td className="py-2 px-3 font-mono text-white">{sb.invoice_number}</td>
                      <td className="py-2 px-3">
                        <Link href={`/admin/orders/${sb.order_id}`} className="text-luxe-gold hover:underline">
                          {sb.order_id.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className="text-right py-2 px-3 text-emerald-400">{formatEur(sb.gross_amount)}</td>
                      <td className="py-2 px-3 text-luxe-silver">
                        {new Date(sb.issued_date).toLocaleDateString('de-DE')}
                      </td>
                      <td className="py-2 px-3">
                        {sb.e_invoice_xml_url ? (
                          <a
                            href={`/api/admin/invoices/download?filename=${encodeURIComponent(sb.e_invoice_xml_url)}`}
                            className="text-luxe-gold hover:underline text-sm"
                          >
                            XML
                          </a>
                        ) : (
                          <span className="text-luxe-silver/60 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Steuer-Autopilot Details */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Banknote className="w-5 h-5 text-luxe-gold" />
            Steuer-Autopilot ({selectedYear})
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Rücklage vom tatsächlichen Gewinn (Einnahmen minus Ausgaben). Steuersatz in Finanz-Parameter einstellbar.
          </p>
        </CardHeader>
        <CardContent>
          {tax ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg bg-luxe-black/50 border border-luxe-gray p-4">
                <p className="text-xs font-medium text-luxe-silver uppercase tracking-wider">Einnahmen</p>
                <p className="text-xl font-bold text-white mt-1">{formatEur(tax.total_income)}</p>
              </div>
              <div className="rounded-lg bg-luxe-black/50 border border-luxe-gray p-4">
                <p className="text-xs font-medium text-luxe-silver uppercase tracking-wider">Ausgaben</p>
                <p className="text-xl font-bold text-white mt-1">{formatEur(tax.total_expenses)}</p>
              </div>
              <div className="rounded-lg bg-luxe-black/50 border border-luxe-gray p-4">
                <p className="text-xs font-medium text-luxe-silver uppercase tracking-wider">Gewinn</p>
                <p className={`text-xl font-bold mt-1 ${tax.actual_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatEur(tax.actual_profit)}
                </p>
              </div>
              <div className="rounded-lg bg-luxe-gold/10 border border-luxe-gold/30 p-4">
                <p className="text-xs font-medium text-luxe-gold uppercase tracking-wider">Rücklage (Steuer)</p>
                <p className="text-xl font-bold text-luxe-gold mt-1">{formatEur(tax.reserve_30_percent)}</p>
              </div>
            </div>
          ) : (
            <p className="text-luxe-silver">Keine Steuerdaten verfügbar.</p>
          )}
          <p className="text-xs text-luxe-silver mt-4">
            PDF-Button erzeugt eine Monatsübersicht. CSV-Export listet alle Einnahmen und Ausgaben des Jahres für das Finanzamt.
            Manuelle Ausgaben unter <Link href="/admin/operations/expenses" className="text-luxe-gold font-medium hover:underline">Einkauf → Ausgaben (BWA)</Link> erfassen – sie fließen automatisch in die BWA ein.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
