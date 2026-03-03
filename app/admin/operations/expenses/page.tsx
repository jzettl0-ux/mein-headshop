'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Receipt, Loader2, Upload, FileText, ArrowLeft, Calendar, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const EXPENSE_CATEGORIES = [
  { value: 'verpackung', label: 'Verpackung (Kartons, etc.)' },
  { value: 'buromaterial', label: 'Büromaterial' },
  { value: 'werbung', label: 'Werbung' },
  { value: 'miete', label: 'Miete' },
  { value: 'sonstige', label: 'Sonstige' },
] as const

type ExpenseRow = {
  id: string
  month_key: string
  expense_date: string | null
  amount_eur: number
  category: string
  description: string | null
  invoice_pdf_url: string | null
  created_at: string
}

function formatEur(n: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(s: string | null): string {
  if (!s) return '–'
  return new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function AdminOperationsExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [expenseSubmitting, setExpenseSubmitting] = useState(false)
  const [expensePdfUploading, setExpensePdfUploading] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    expense_date: new Date().toISOString().slice(0, 10),
    amount_eur: '',
    category: 'sonstige',
    description: '',
    invoice_pdf_url: '',
  })

  const loadExpenses = () => {
    setExpensesLoading(true)
    fetch('/api/admin/finances/expenses')
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => setExpenses(Array.isArray(list) ? list : []))
      .catch(() => setExpenses([]))
      .finally(() => setExpensesLoading(false))
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  const handleExpensePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || file.type !== 'application/pdf') return
    setExpensePdfUploading(true)
    const form = new FormData()
    form.append('file', file)
    fetch('/api/admin/finances/expenses/upload', { method: 'POST', body: form })
      .then((res) => res.json())
      .then((d) => {
        if (d.url) setExpenseForm((f) => ({ ...f, invoice_pdf_url: d.url }))
      })
      .finally(() => setExpensePdfUploading(false))
  }

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const expense_date = expenseForm.expense_date.slice(0, 10)
    const amount_eur = parseFloat(expenseForm.amount_eur)
    if (!expense_date.match(/^\d{4}-\d{2}-\d{2}$/) || !Number.isFinite(amount_eur) || amount_eur <= 0) return
    setExpenseSubmitting(true)
    fetch('/api/admin/finances/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expense_date,
        amount_eur,
        category: expenseForm.category,
        description: expenseForm.description.trim() || null,
        invoice_pdf_url: expenseForm.invoice_pdf_url.trim() || null,
      }),
    })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('Fehler')))
      .then((newRow) => {
        setExpenses((prev) => [newRow, ...prev])
        setExpenseForm({
          expense_date: new Date().toISOString().slice(0, 10),
          amount_eur: '',
          category: 'sonstige',
          description: '',
          invoice_pdf_url: '',
        })
      })
      .finally(() => setExpenseSubmitting(false))
  }

  const displayDate = (row: ExpenseRow) => row.expense_date ?? row.created_at

  return (
    <div className="space-y-8 max-w-5xl">
      <Link
        href="/admin/operations"
        className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Zurück zum Einkauf
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Receipt className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
          Ausgaben (BWA)
        </h1>
        <p className="text-white/80 mt-1">
          Alle Betriebsausgaben: Miete, Werbung, Verpackung, Büromaterial – tagesgenau. Fließen in die BWA und das Finanz-Dashboard ein. (Produkt-Einkauf separat unter Einkauf.)
        </p>
      </div>

      {/* Neue Ausgabe erfassen */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            Neue Ausgabe erfassen
          </CardTitle>
          <p className="text-sm text-white/70 mt-1">
            Kartons, Büromaterial, Werbung, Miete – mit Datum auf den Tag genau. Optional Rechnungs-PDF hochladen.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleExpenseSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
              <div className="lg:col-span-2">
                <Label htmlFor="exp-date" className="text-white/90 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-white/60" />
                  Datum
                </Label>
                <Input
                  id="exp-date"
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, expense_date: e.target.value }))}
                  className="mt-1.5 bg-luxe-black border-luxe-gray text-white"
                  required
                />
              </div>
              <div className="lg:col-span-2">
                <Label htmlFor="exp-amount" className="text-white/90">Betrag (€)</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={expenseForm.amount_eur}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, amount_eur: e.target.value }))}
                  placeholder="0,00"
                  className="mt-1.5 bg-luxe-black border-luxe-gray text-white placeholder:text-white/60"
                  required
                />
              </div>
              <div className="lg:col-span-2">
                <Label htmlFor="exp-category" className="text-white/90">Kategorie</Label>
                <select
                  id="exp-category"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
                  className="mt-1.5 w-full h-10 rounded-md border border-luxe-gray bg-luxe-black px-3 text-white text-sm"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-3">
                <Label htmlFor="exp-desc" className="text-white/90">Beschreibung</Label>
                <Input
                  id="exp-desc"
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="z. B. Kartons 40×30, Büromaterial"
                  className="mt-1.5 bg-luxe-black border-luxe-gray text-white placeholder:text-white/60"
                />
              </div>
              <div className="lg:col-span-2 flex flex-col gap-1.5">
                <Label className="text-white/90">Rechnung (PDF)</Label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    disabled={expensePdfUploading}
                    onChange={handleExpensePdfChange}
                  />
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-luxe-gray bg-luxe-black/50 text-white/90 text-sm hover:bg-luxe-gray/20 transition-colors">
                    {expensePdfUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {expensePdfUploading ? 'Wird hochgeladen…' : 'PDF hochladen'}
                  </span>
                </label>
                {expenseForm.invoice_pdf_url && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Rechnung angehängt
                  </span>
                )}
              </div>
              <div className="lg:col-span-1">
                <Button
                  type="submit"
                  variant="luxe"
                  disabled={expenseSubmitting || !expenseForm.amount_eur}
                  className="w-full"
                >
                  {expenseSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Erfassen'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Erfasste Ausgaben – Tabelle */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Erfasste Ausgaben</CardTitle>
          <p className="text-sm text-white/70 mt-1">
            Alle manuellen Ausgaben. Sortiert nach Erfassung.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {expensesLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-white/60" />
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-white/60 py-16 text-center">Noch keine Ausgaben erfasst.</p>
          ) : (
            <div className="rounded-lg border border-luxe-gray overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-luxe-gray hover:bg-transparent">
                    <TableHead className="text-white/80 font-medium">Datum</TableHead>
                    <TableHead className="text-white/80 font-medium">Kategorie</TableHead>
                    <TableHead className="text-white/80 font-medium">Beschreibung</TableHead>
                    <TableHead className="text-white/80 font-medium text-right">Betrag</TableHead>
                    <TableHead className="text-white/80 font-medium w-24">Rechnung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((row) => (
                    <TableRow key={row.id} className="border-luxe-gray hover:bg-luxe-gray/20">
                      <TableCell className="text-white/90 font-medium">
                        {formatDate(displayDate(row))}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 capitalize">
                          {row.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/90 max-w-[220px] truncate" title={row.description ?? ''}>
                        {row.description || '–'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-white">
                        {formatEur(Number(row.amount_eur))}
                      </TableCell>
                      <TableCell>
                        {row.invoice_pdf_url ? (
                          <a
                            href={row.invoice_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-luxe-gold hover:underline text-sm font-medium inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </a>
                        ) : (
                          <span className="text-white/40 text-sm">–</span>
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
