'use client'

import { useState, useEffect } from 'react'
import { FlaskConical, Loader2, Image, Type, FileText, Plus, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

type Experiment = {
  experiment_id: string
  product_id: string
  vendor_id: string | null
  experiment_type: string
  variant_a_data: string
  variant_b_data: string
  status: string
  start_date: string
  end_date: string | null
  product_name: string
  product_slug: string | null
}

type MetricRow = {
  variant_assigned: string
  impressions_count: number
  clicks_count: number
  purchases_count: number
}

const TYPE_LABELS: Record<string, string> = {
  MAIN_IMAGE: 'Hauptbild',
  PRODUCT_TITLE: 'Produkt-Titel',
  A_PLUS_CONTENT: 'A+ Inhalt',
}

const STATUS_LABELS: Record<string, string> = {
  RUNNING: 'Läuft',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
}

export default function AdminAbExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    product_id: '',
    experiment_type: 'MAIN_IMAGE',
    variant_a_data: '',
    variant_b_data: '',
  })
  const [metricsByExp, setMetricsByExp] = useState<Record<string, MetricRow[]>>({})
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/ab-experiments')
      .then((r) => (r.ok ? r.json() : { experiments: [] }))
      .then((d) => setExperiments(d.experiments ?? []))
      .catch(() => setExperiments([]))
  }

  useEffect(() => {
    setLoading(true)
    load()
    fetch('/api/admin/products/list')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setProducts(Array.isArray(d) ? d.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const loadMetrics = async (experiment_id: string) => {
    const res = await fetch(`/api/admin/ab-experiments/${experiment_id}/metrics`)
    if (!res.ok) return
    const d = await res.json()
    setMetricsByExp((prev) => ({ ...prev, [experiment_id]: d.metrics ?? [] }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product_id || !form.variant_a_data.trim() || !form.variant_b_data.trim()) {
      toast({ title: 'Produkt, Variante A und B ausfüllen', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/ab-experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: form.product_id,
          experiment_type: form.experiment_type,
          variant_a_data: form.variant_a_data.trim(),
          variant_b_data: form.variant_b_data.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'Experiment angelegt' })
      setForm({ product_id: '', experiment_type: 'MAIN_IMAGE', variant_a_data: '', variant_b_data: '' })
      setShowForm(false)
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const IconForType = (t: string) => {
    if (t === 'MAIN_IMAGE') return Image
    if (t === 'PRODUCT_TITLE') return Type
    return FileText
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-luxe-gold" />
            A/B Experimente (Manage Your Experiments)
          </h1>
          <p className="text-sm text-luxe-silver mt-1">
            Split-Tests für Hauptbild, Titel oder A+ Content – Metriken: Impressions, Clicks, Purchases pro Variante.
          </p>
        </div>
        <Button variant="luxe" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Neues Experiment
        </Button>
      </div>

      {showForm && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Experiment anlegen</h2>
            <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
              <div>
                <label className="text-sm text-luxe-silver block mb-1">Produkt</label>
                <Select value={form.product_id} onValueChange={(v) => setForm((f) => ({ ...f, product_id: v }))}>
                  <SelectTrigger className="bg-luxe-black border-luxe-gray text-white">
                    <SelectValue placeholder="Produkt wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-luxe-silver block mb-1">Typ</label>
                <Select value={form.experiment_type} onValueChange={(v) => setForm((f) => ({ ...f, experiment_type: v }))}>
                  <SelectTrigger className="bg-luxe-black border-luxe-gray text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAIN_IMAGE">Hauptbild</SelectItem>
                    <SelectItem value="PRODUCT_TITLE">Produkt-Titel</SelectItem>
                    <SelectItem value="A_PLUS_CONTENT">A+ Inhalt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-luxe-silver block mb-1">Variante A (Daten/URL/Text)</label>
                <input
                  value={form.variant_a_data}
                  onChange={(e) => setForm((f) => ({ ...f, variant_a_data: e.target.value }))}
                  className="w-full rounded bg-luxe-black border border-luxe-gray px-3 py-2 text-white text-sm"
                  placeholder="z. B. URL oder Text für A"
                />
              </div>
              <div>
                <label className="text-sm text-luxe-silver block mb-1">Variante B</label>
                <input
                  value={form.variant_b_data}
                  onChange={(e) => setForm((f) => ({ ...f, variant_b_data: e.target.value }))}
                  className="w-full rounded bg-luxe-black border border-luxe-gray px-3 py-2 text-white text-sm"
                  placeholder="z. B. URL oder Text für B"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>Anlegen</Button>
                <Button type="button" variant="admin-outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : experiments.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine A/B Experimente. Klicke auf „Neues Experiment“ um eines anzulegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Laufende & abgeschlossene Experimente</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{experiments.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {experiments.map((e) => {
                const Icon = IconForType(e.experiment_type)
                return (
                  <li
                    key={e.experiment_id}
                    className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-luxe-gold/10">
                        <Icon className="h-4 w-4 text-luxe-gold" />
                      </span>
                      <div>
                        <Link
                          href={e.product_slug ? `/admin/products/${e.product_id}/edit` : '#'}
                          className="text-luxe-gold hover:underline font-medium"
                        >
                          {e.product_name || e.product_id}
                        </Link>
                        <span className="text-luxe-silver ml-2">
                          {TYPE_LABELS[e.experiment_type] ?? e.experiment_type} – {STATUS_LABELS[e.status] ?? e.status}
                        </span>
                        {metricsByExp[e.experiment_id]?.length > 0 && (
                          <div className="text-xs text-luxe-silver mt-1">
                            {metricsByExp[e.experiment_id].map((m) => (
                              <span key={m.variant_assigned} className="mr-3">
                                {m.variant_assigned}: {m.impressions_count} Imp. / {m.clicks_count} Klicks / {m.purchases_count} Käufe
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="admin-outline"
                        size="sm"
                        onClick={() => loadMetrics(e.experiment_id)}
                        className="flex items-center gap-1"
                      >
                        <BarChart3 className="w-4 h-4" /> Metriken
                      </Button>
                      <span className="text-luxe-silver text-xs">
                        seit {e.start_date ? new Date(e.start_date).toLocaleDateString('de-DE') : '–'}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
