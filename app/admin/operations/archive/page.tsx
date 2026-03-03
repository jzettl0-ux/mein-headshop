'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, ArrowLeft, Loader2, ExternalLink, Filter } from 'lucide-react'
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

type Supplier = { id: string; name: string }

function formatEur(n: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminOperationsArchivePage() {
  const [loading, setLoading] = useState(true)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  const [filterMonth, setFilterMonth] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')

  useEffect(() => {
    fetch('/api/admin/suppliers')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('archive', '1')
    if (filterMonth) params.set('month', filterMonth)
    if (filterSupplier) params.set('supplier_id', filterSupplier)
    fetch(`/api/admin/operations?${params}`)
      .then((r) => (r.ok ? r.json() : { purchases: [] }))
      .then((data: { purchases?: Purchase[] }) => setPurchases(data.purchases ?? []))
      .catch(() => setPurchases([]))
      .finally(() => setLoading(false))
  }, [filterMonth, filterSupplier])

  const withPdf = purchases.filter((p) => p.invoice_pdf_url)
  const months = [...new Set(purchases.map((p) => String(p.invoice_date).slice(0, 7)))].sort().reverse()

  return (
    <div className="space-y-8 max-w-5xl">
      <Link href="/admin/operations" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Zurück zur Übersicht
      </Link>

      <h1 className="text-2xl font-bold text-white">Dokumenten-Archiv</h1>
      <p className="text-white/80">Alle hochgeladenen Rechnungs-PDFs. Nach Datum oder Lieferant filtern.</p>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-luxe-gold" />
            Rechnungen
          </CardTitle>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-white/60" />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="rounded-md border border-luxe-gray bg-luxe-black px-3 py-1.5 text-sm text-white"
            >
              <option value="">Alle Monate</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {new Date(m + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="rounded-md border border-luxe-gray bg-luxe-black px-3 py-1.5 text-sm text-white"
            >
              <option value="">Alle Lieferanten</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-white/60" />
            </div>
          ) : withPdf.length === 0 ? (
            <p className="text-white/60 py-8 text-center">
              {purchases.length === 0
                ? 'Keine Einkäufe im Archiv.'
                : 'Keine Rechnungs-PDFs in den gefilterten Einkäufen. PDFs beim Erfassen eines Einkaufs hochladen.'}
            </p>
          ) : (
            <div className="rounded-lg border border-luxe-gray overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-luxe-gray hover:bg-transparent">
                    <TableHead className="text-white/80 font-medium">Datum</TableHead>
                    <TableHead className="text-white/80 font-medium">Lieferant</TableHead>
                    <TableHead className="text-white/80 font-medium">Rechnungsnr.</TableHead>
                    <TableHead className="text-white/80 font-medium text-right">Betrag</TableHead>
                    <TableHead className="text-white/80 font-medium w-28">Rechnung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withPdf.map((p) => (
                    <TableRow key={p.id} className="border-luxe-gray hover:bg-luxe-gray/20">
                      <TableCell className="text-white/90">{formatDate(p.invoice_date)}</TableCell>
                      <TableCell className="text-white/90">{p.supplier_name ?? '–'}</TableCell>
                      <TableCell className="text-white/90">{p.invoice_number ?? '–'}</TableCell>
                      <TableCell className="text-right font-medium text-white">{formatEur(p.total_eur)}</TableCell>
                      <TableCell>
                        <a
                          href={p.invoice_pdf_url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-luxe-gold hover:underline text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          PDF öffnen
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && purchases.length > 0 && withPdf.length < purchases.length && (
        <p className="text-sm text-white/60">
          {purchases.length - withPdf.length} Einkauf/Einkäufe ohne Rechnungs-PDF.
        </p>
      )}
    </div>
  )
}
