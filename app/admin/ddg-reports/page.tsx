'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ShieldAlert, ExternalLink, Loader2, FileJson, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface DdgReport {
  report_id: string
  target_asin: string
  target_product_id: string | null
  violation_type: string
  violation_label: string
  status: string
  status_label: string
  report_description: string | null
  reporter_email: string | null
  action_taken: string | null
  reported_at: string
  resolved_at: string | null
}

const STATUS_OPTIONS = [
  { value: '', label: 'Alle' },
  { value: 'PENDING', label: 'Offen' },
  { value: 'INVESTIGATING', label: 'In Prüfung' },
  { value: 'REMOVED', label: 'Entfernt' },
  { value: 'DISMISSED', label: 'Abgelehnt' },
]

interface TransparencyStats {
  period: { from: string; to: string }
  total: number
  by_status: Record<string, { count: number; label: string }>
  by_violation_type: Record<string, { count: number; label: string }>
  trusted_flagger_reports: number
  median_resolution_hours: number | null
  median_resolution_days: number | null
  resolved_count: number
}

export default function AdminDdgReportsPage() {
  const [reports, setReports] = useState<DdgReport[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusByReport, setStatusByReport] = useState<Record<string, string>>({})
  const [actionByReport, setActionByReport] = useState<Record<string, string>>({})
  const [transparencyStats, setTransparencyStats] = useState<TransparencyStats | null>(null)
  const [transparencyLoading, setTransparencyLoading] = useState(false)
  const [transparencyFrom, setTransparencyFrom] = useState(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    return d.toISOString().slice(0, 10)
  })
  const [transparencyTo, setTransparencyTo] = useState(() => new Date().toISOString().slice(0, 10))
  const { toast } = useToast()

  const transparencyParams = useMemo(() => {
    const p = new URLSearchParams()
    p.set('from', transparencyFrom)
    p.set('to', transparencyTo)
    return p
  }, [transparencyFrom, transparencyTo])

  useEffect(() => {
    setTransparencyLoading(true)
    fetch(`/api/admin/ddg-reports/transparency?${transparencyParams}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data?.stats && setTransparencyStats(data.stats))
      .catch(() => setTransparencyStats(null))
      .finally(() => setTransparencyLoading(false))
  }, [transparencyParams])

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/admin/ddg-reports?${params}`)
      .then((r) => r.ok ? r.json() : { reports: [] })
      .then((data) => setReports(Array.isArray(data.reports) ? data.reports : []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    setUpdatingId(reportId)
    try {
      const res = await fetch(`/api/admin/ddg-reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          action_taken: actionByReport[reportId] || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Aktualisierung fehlgeschlagen')
      }
      const updated = await res.json()
      setReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? { ...r, ...updated, status_label: STATUS_OPTIONS.find((o) => o.value === newStatus)?.label ?? newStatus } : r))
      )
      setStatusByReport((prev) => ({ ...prev, [reportId]: newStatus }))
      toast({ title: 'Status aktualisiert' })
    } catch (e) {
      toast({ title: 'Fehler', description: (e as Error)?.message, variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleActionChange = async (reportId: string) => {
    const action = actionByReport[reportId]?.trim()
    setUpdatingId(reportId)
    try {
      const res = await fetch(`/api/admin/ddg-reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_taken: action || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Speichern fehlgeschlagen')
      }
      const updated = await res.json()
      setReports((prev) => prev.map((r) => (r.report_id === reportId ? { ...r, action_taken: updated.action_taken } : r)))
      toast({ title: 'Maßnahme gespeichert' })
    } catch (e) {
      toast({ title: 'Fehler', description: (e as Error)?.message, variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleString('de-DE')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-luxe-gold" />
          DDG Notice & Action
        </h1>
        <p className="mt-1 text-luxe-silver">
          Meldungen illegaler Inhalte (§17 DDG). Transparenzbericht und Status-Workflow.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-white">Content-Reports</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-luxe-silver">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-luxe-gray bg-luxe-black px-3 py-1.5 text-sm text-white"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-luxe-silver flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Laden...
            </p>
          ) : reports.length === 0 ? (
            <p className="text-luxe-silver">Keine Meldungen vorhanden.</p>
          ) : (
            <div className="space-y-6">
              {reports.map((r) => (
                <div
                  key={r.report_id}
                  className="rounded-lg border border-luxe-gray p-4 bg-luxe-black/50"
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        r.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300'
                          : r.status === 'INVESTIGATING'
                            ? 'bg-blue-500/20 text-blue-300'
                            : r.status === 'REMOVED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-zinc-500/20 text-zinc-300'
                      }`}
                    >
                      {r.status_label}
                    </span>
                    <span className="text-luxe-silver">{r.violation_label}</span>
                    <span className="text-luxe-silver">·</span>
                    <span className="text-luxe-silver">{formatDate(r.reported_at)}</span>
                    {r.resolved_at && (
                      <>
                        <span className="text-luxe-silver">·</span>
                        <span className="text-luxe-silver/70">Erledigt: {formatDate(r.resolved_at)}</span>
                      </>
                    )}
                  </div>
                  <p className="text-white font-medium break-all">
                    {r.target_asin.startsWith('http') ? (
                      <a
                        href={r.target_asin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-luxe-gold hover:underline inline-flex items-center gap-1"
                      >
                        {r.target_asin.slice(0, 80)}
                        {r.target_asin.length > 80 ? '…' : ''}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      r.target_asin
                    )}
                  </p>
                  {r.target_product_id && (
                    <Link
                      href={`/admin/products/${r.target_product_id}/edit`}
                      className="text-sm text-luxe-gold hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" /> Produkt bearbeiten
                    </Link>
                  )}
                  {r.report_description && (
                    <p className="mt-2 text-luxe-silver text-sm whitespace-pre-wrap">{r.report_description}</p>
                  )}
                  {r.reporter_email && (
                    <p className="mt-1 text-sm text-luxe-silver">
                      Melder: <span className="text-white">{r.reporter_email}</span>
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={statusByReport[r.report_id] ?? r.status}
                      onChange={(e) => {
                        const v = e.target.value
                        setStatusByReport((prev) => ({ ...prev, [r.report_id]: v }))
                        handleStatusChange(r.report_id, v)
                      }}
                      disabled={updatingId === r.report_id}
                      className="rounded-md border border-luxe-gray bg-luxe-black px-2 py-1 text-sm text-white"
                    >
                      {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Maßnahme (z. B. Inhalt entfernt)"
                      value={actionByReport[r.report_id] ?? r.action_taken ?? ''}
                      onChange={(e) => setActionByReport((prev) => ({ ...prev, [r.report_id]: e.target.value }))}
                      className="flex-1 min-w-[200px] rounded-md border border-luxe-gray bg-luxe-black px-3 py-1.5 text-sm text-white placeholder:text-luxe-silver/60"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-luxe-gray text-luxe-silver hover:text-white"
                      disabled={updatingId === r.report_id}
                      onClick={() => handleActionChange(r.report_id)}
                    >
                      Maßnahme speichern
                    </Button>
                    {updatingId === r.report_id && <Loader2 className="h-4 w-4 animate-spin text-luxe-silver" />}
                  </div>
                  {r.action_taken && (
                    <p className="mt-2 text-sm text-luxe-silver">
                      <span className="text-white/80">Maßnahme:</span> {r.action_taken}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Transparenzbericht §17 DDG</CardTitle>
          <p className="text-sm text-luxe-silver">
            Aggregierte Statistiken für den jährlichen Transparenzbericht (DSA/DDG). Export als JSON oder CSV.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="transparency-from" className="text-sm text-luxe-silver">Von</label>
              <input
                id="transparency-from"
                type="date"
                value={transparencyFrom}
                onChange={(e) => setTransparencyFrom(e.target.value)}
                className="rounded-md border border-luxe-gray bg-luxe-black px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="transparency-to" className="text-sm text-luxe-silver">Bis</label>
              <input
                id="transparency-to"
                type="date"
                value={transparencyTo}
                onChange={(e) => setTransparencyTo(e.target.value)}
                className="rounded-md border border-luxe-gray bg-luxe-black px-3 py-1.5 text-sm text-white"
              />
            </div>
          </div>
          {transparencyLoading ? (
            <p className="text-luxe-silver flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Lade Statistik...
            </p>
          ) : transparencyStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg bg-luxe-black/50 p-3 border border-luxe-gray">
                  <p className="text-xs text-luxe-silver">Gesamt Meldungen</p>
                  <p className="text-xl font-bold text-white">{transparencyStats.total}</p>
                </div>
                <div className="rounded-lg bg-luxe-black/50 p-3 border border-luxe-gray">
                  <p className="text-xs text-luxe-silver">Erledigt (Entfernt/Abgelehnt)</p>
                  <p className="text-xl font-bold text-white">{transparencyStats.resolved_count}</p>
                </div>
                <div className="rounded-lg bg-luxe-black/50 p-3 border border-luxe-gray">
                  <p className="text-xs text-luxe-silver">Trusted-Flagger-Meldungen</p>
                  <p className="text-xl font-bold text-white">{transparencyStats.trusted_flagger_reports}</p>
                </div>
                <div className="rounded-lg bg-luxe-black/50 p-3 border border-luxe-gray">
                  <p className="text-xs text-luxe-silver">Median Bearbeitungszeit</p>
                  <p className="text-xl font-bold text-white">
                    {transparencyStats.median_resolution_days != null
                      ? `${transparencyStats.median_resolution_days} Tage`
                      : '–'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-xs text-luxe-silver mb-1">Nach Status</p>
                  <ul className="text-sm text-white space-y-1">
                    {Object.entries(transparencyStats.by_status).map(([k, v]) => (
                      <li key={k}>{v.label}: {v.count}</li>
                    ))}
                    {Object.keys(transparencyStats.by_status).length === 0 && <li className="text-luxe-silver">–</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-luxe-silver mb-1">Nach Meldetyp</p>
                  <ul className="text-sm text-white space-y-1">
                    {Object.entries(transparencyStats.by_violation_type).map(([k, v]) => (
                      <li key={k}>{v.label}: {v.count}</li>
                    ))}
                    {Object.keys(transparencyStats.by_violation_type).length === 0 && <li className="text-luxe-silver">–</li>}
                  </ul>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <a
                  href={`/api/admin/ddg-reports/transparency?${transparencyParams}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-luxe-gray bg-luxe-black px-4 py-2 text-sm text-white hover:bg-luxe-gray/30"
                >
                  <FileJson className="h-4 w-4" />
                  Als JSON exportieren
                </a>
                <a
                  href={`/api/admin/ddg-reports/transparency?${transparencyParams}&format=csv`}
                  download
                  className="inline-flex items-center gap-2 rounded-md border border-luxe-gray bg-luxe-black px-4 py-2 text-sm text-white hover:bg-luxe-gray/30"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Als CSV exportieren
                </a>
              </div>
            </div>
          ) : (
            <p className="text-luxe-silver">Keine Daten für den gewählten Zeitraum.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="pt-6">
          <Link
            href="/illegale-inhalte-melden"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-luxe-gold hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Öffentliches Meldeformular öffnen
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
