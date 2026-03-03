'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Package, Plus, Loader2, FileText, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Purchase = {
  id: string
  supplier_id: string | null
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string
  type: string
  total_eur: number
  invoice_pdf_url: string | null
  notes: string | null
  created_at: string
}

type Summary = { cogs: number; opex: number }

function formatEur(n: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminOperationsPage() {
  const [loading, setLoading] = useState(true)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [summary, setSummary] = useState<Summary>({ cogs: 0, opex: 0 })
  const [currentMonth, setCurrentMonth] = useState('')

  useEffect(() => {
    const now = new Date()
    const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setCurrentMonth(m)
    fetch(`/api/admin/operations?month=${m}`)
      .then((res) => (res.ok ? res.json() : { purchases: [], summary: { cogs: 0, opex: 0 } }))
      .then((data: { purchases?: Purchase[]; summary?: Summary }) => {
        setPurchases(data.purchases ?? [])
        setSummary(data.summary ?? { cogs: 0, opex: 0 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const monthLabel = currentMonth
    ? new Date(currentMonth + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    : ''

  const productPurchases = purchases.filter((p) => p.type === 'wareneinkauf')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Einkauf</h1>
        <p className="text-white/80 mt-1">
          Wareneinkauf (COGS) – Produkte mit Lieferant und Bestandserhöhung. Sonstige Ausgaben (Miete, Werbung, Verpackung) unter Ausgaben (BWA).
        </p>
      </div>

      {/* Karte: Produkt-Einkauf */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/85">Wareneinkauf (COGS)</CardTitle>
            <Package className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-white/60" />
            ) : (
              <span className="text-2xl font-bold text-white">{formatEur(summary.cogs)}</span>
            )}
            <p className="text-xs text-white/60 mt-1">im {monthLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* Link zu Ausgaben (BWA) */}
      <Link
        href="/admin/operations/expenses"
        className="flex items-center gap-3 p-4 rounded-lg border border-luxe-gray bg-luxe-charcoal/80 hover:bg-luxe-gray/20 transition-colors"
      >
        <Receipt className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <p className="font-medium text-white">Ausgaben (BWA)</p>
          <p className="text-sm text-white/70">Miete, Werbung, Verpackung, Büromaterial – tagesgenau erfassen</p>
        </div>
        <span className="text-white/50 ml-auto">→</span>
      </Link>

      {/* Produkt-Einkäufe */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Produkt-Einkäufe</CardTitle>
          <div className="flex gap-2">
            <Link href="/admin/operations/new">
              <Button variant="luxe" size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Neuer Einkauf
              </Button>
            </Link>
            <Link href="/admin/operations/archive">
              <Button variant="admin-outline" size="sm" className="gap-1">
                <FileText className="w-4 h-4" />
                Dokumenten-Archiv
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-white/60" />
            </div>
          ) : productPurchases.length === 0 ? (
            <p className="text-white/60 py-8 text-center">Noch keine Produkt-Einkäufe erfasst.</p>
          ) : (
            <div className="rounded-lg border border-luxe-gray overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-luxe-gray hover:bg-transparent">
                    <TableHead className="text-white/80 font-medium">Datum</TableHead>
                    <TableHead className="text-white/80 font-medium">Lieferant</TableHead>
                    <TableHead className="text-white/80 font-medium text-right">Betrag</TableHead>
                    <TableHead className="text-white/80 font-medium w-24">Rechnung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productPurchases.map((p) => (
                    <TableRow key={p.id} className="border-luxe-gray hover:bg-luxe-gray/20">
                      <TableCell className="text-white/90">{formatDate(p.invoice_date)}</TableCell>
                      <TableCell className="text-white/90">{p.supplier_name ?? '–'}</TableCell>
                      <TableCell className="text-right font-medium text-white">
                        {formatEur(p.total_eur)}
                      </TableCell>
                      <TableCell>
                        {p.invoice_pdf_url ? (
                          <a
                            href={p.invoice_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-luxe-gold hover:underline text-sm"
                          >
                            PDF
                          </a>
                        ) : (
                          <span className="text-white/40">–</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
