'use client'

import { useState, useEffect, useCallback } from 'react'
import { History, Loader2, Filter, Search, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AuditEntry {
  id: string
  entity_type: string
  entity_id: string | null
  action: string
  field_name: string | null
  old_value: string | null
  new_value: string | null
  changed_by_email: string | null
  changed_by_id: string | null
  created_at: string
}

const ENTITY_OPTIONS = [
  { value: '_all', label: 'Alle Bereiche' },
  { value: 'product', label: 'Produkte' },
  { value: 'finance_settings', label: 'Finanz-Parameter' },
  { value: 'order', label: 'Bestellungen' },
  { value: 'staff', label: 'Mitarbeiter' },
  { value: 'customer', label: 'Kunden' },
] as const

const ACTION_OPTIONS = [
  { value: '_all', label: 'Alle Aktionen' },
  { value: 'create', label: 'Erstellt' },
  { value: 'update', label: 'Geändert' },
  { value: 'delete', label: 'Gelöscht' },
] as const

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function entityLabel(type: string, id: string | null): string {
  if (type === 'finance_settings') return 'Finanz-Parameter'
  if (type === 'product' && id) return `Produkt ${id.slice(0, 8)}…`
  if (type === 'order' && id) return `Bestellung ${id.slice(0, 8)}…`
  if (type === 'staff' && id) return `Mitarbeiter ${id.slice(0, 8)}…`
  if (type === 'customer' && id) return `Kunde ${id.slice(0, 8)}…`
  return type
}

function actionLabel(action: string): string {
  const o = ACTION_OPTIONS.find((a) => a.value === action)
  return o?.label ?? action
}

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [entityType, setEntityType] = useState<string>('_all')
  const [action, setAction] = useState<string>('_all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [changedBy, setChangedBy] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [filtersOpen, setFiltersOpen] = useState(true)

  const fetchEntries = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('limit', '100')
    if (entityType && entityType !== '_all') params.set('entity_type', entityType)
    if (action && action !== '_all') params.set('action', action)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (changedBy.trim()) params.set('changed_by', changedBy.trim())
    if (search.trim().length >= 2) params.set('search', search.trim())
    fetch(`/api/admin/audit-logs?${params}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [entityType, action, dateFrom, dateTo, changedBy, search])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const clearFilters = () => {
    setEntityType('_all')
    setAction('_all')
    setDateFrom('')
    setDateTo('')
    setChangedBy('')
    setSearch('')
  }

  const hasActiveFilters =
    (entityType && entityType !== '_all') ||
    (action && action !== '_all') ||
    dateFrom ||
    dateTo ||
    changedBy.trim() ||
    search.trim().length >= 2

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-neutral-600" />
            Audit-Log
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Wer hat was wann geändert? Änderungen an Preisen, Beständen, Bestellungen und Finanz-Parametern.
          </p>
        </div>
      </div>

      <Card className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-neutral-100 py-4">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle className="text-neutral-900 text-lg font-medium flex items-center gap-2">
              <Filter className="w-5 h-5 text-neutral-500" />
              Filter
              {hasActiveFilters && (
                <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Aktiv
                </span>
              )}
            </CardTitle>
            <span className="text-neutral-400 text-sm">{filtersOpen ? 'Einklappen' : 'Ausklappen'}</span>
          </button>
        </CardHeader>
        {filtersOpen && (
          <CardContent className="py-4 border-b border-neutral-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Bereich</label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Alle Bereiche" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Aktion</label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Alle Aktionen" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Von Datum</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Bis Datum</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Geändert von (E-Mail)</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    type="text"
                    placeholder="z. B. admin@…"
                    value={changedBy}
                    onChange={(e) => setChangedBy(e.target.value)}
                    className="h-10 pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Suche (Feld/Wert, min. 2 Zeichen)</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    type="text"
                    placeholder="In Feld oder Wert suchen"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 pl-9"
                  />
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                  <X className="w-4 h-4" />
                  Filter zurücksetzen
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-neutral-100 py-4">
          <CardTitle className="text-neutral-900 text-lg font-medium">Änderungshistorie</CardTitle>
          {!loading && (
            <p className="text-sm text-neutral-500 mt-1">
              {entries.length} Einträge
              {hasActiveFilters && ' (gefiltert)'}
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-neutral-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Lade…
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-neutral-500">
              <History className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p>Keine Einträge vorhanden.</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Filter zurücksetzen
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-200 hover:bg-transparent bg-neutral-50/80">
                    <TableHead className="text-neutral-600 font-medium whitespace-nowrap">Zeit</TableHead>
                    <TableHead className="text-neutral-600 font-medium whitespace-nowrap">Bereich</TableHead>
                    <TableHead className="text-neutral-600 font-medium whitespace-nowrap">Aktion</TableHead>
                    <TableHead className="text-neutral-600 font-medium whitespace-nowrap">Feld</TableHead>
                    <TableHead className="text-neutral-600 font-medium min-w-[200px]">Von → Nach</TableHead>
                    <TableHead className="text-neutral-600 font-medium whitespace-nowrap">Geändert von</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((row) => (
                    <TableRow key={row.id} className="border-neutral-200 hover:bg-neutral-50/50">
                      <TableCell className="text-neutral-600 text-sm whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </TableCell>
                      <TableCell className="font-medium text-neutral-900">
                        {entityLabel(row.entity_type, row.entity_id)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-700">
                          {actionLabel(row.action)}
                        </span>
                      </TableCell>
                      <TableCell className="text-neutral-700 font-mono text-sm">{row.field_name ?? '–'}</TableCell>
                      <TableCell className="text-neutral-700">
                        <span className="inline-flex flex-wrap items-baseline gap-1">
                          <span className="text-red-600/90 line-through">{row.old_value ?? '–'}</span>
                          <span className="text-neutral-400">→</span>
                          <span className="text-green-700 font-medium">{row.new_value ?? '–'}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-neutral-600 text-sm">{row.changed_by_email ?? '–'}</TableCell>
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
