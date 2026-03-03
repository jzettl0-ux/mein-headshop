'use client'

import { useState, useEffect } from 'react'
import { Banknote, Loader2, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface FinanceSettingsState {
  tax_rate: string
  mollie_fixed: string
  mollie_percent: string
  revenue_limit: string
}

export default function AdminSettingsFinancesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FinanceSettingsState>({
    tax_rate: '30',
    mollie_fixed: '0.29',
    mollie_percent: '0.25',
    revenue_limit: '22500',
  })
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/settings/finances')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: FinanceSettingsState | null) => {
        if (data) {
          setForm({
            tax_rate: String(data.tax_rate ?? 30),
            mollie_fixed: String(data.mollie_fixed ?? 0.29),
            mollie_percent: String(data.mollie_percent ?? 0.25),
            revenue_limit: String(data.revenue_limit ?? 22500),
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings/finances', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tax_rate: parseFloat(form.tax_rate) || 30,
          mollie_fixed: parseFloat(form.mollie_fixed) ?? 0.29,
          mollie_percent: parseFloat(form.mollie_percent) ?? 0.25,
          revenue_limit: parseFloat(form.revenue_limit) ?? 22500,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast({ title: 'Fehler', description: err.error || 'Speichern fehlgeschlagen', variant: 'destructive' })
        return
      }
      toast({
        title: 'Gespeichert',
        description: 'Finanz-Parameter wirken sofort im Dashboard und bei jeder neuen Bezahlung (Webhook).',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2 text-neutral-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        Lade Einstellungen…
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-2xl">
      <div className="space-y-1">
        <Link
          href="/admin/settings"
          className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zu Einstellungen
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2 mt-4">
          <Banknote className="w-7 h-7 text-neutral-600" />
          Finanz-Parameter
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Zentrale Steuerung für alle Berechnungen. Jede Änderung aktualisiert sofort das Finanz-Dashboard und die Berechnung bei jeder bezahlten Bestellung (tax_reserve, transaction_fee, net_profit).
        </p>
      </div>

      <Card className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-neutral-100">
          <CardTitle className="text-neutral-900 text-lg font-medium">Tabelle finance_settings</CardTitle>
          <p className="text-sm text-neutral-500 font-normal">
            Werte anpassen und speichern – Dashboard und Webhook nutzen diese Werte live.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-neutral-700 font-medium text-sm">Steuerrücklage (tax_rate) in %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={form.tax_rate}
                  onChange={(e) => setForm((f) => ({ ...f, tax_rate: e.target.value }))}
                  className="max-w-[12rem] h-10 border border-neutral-200 bg-white text-neutral-900"
                />
                <p className="text-xs text-neutral-500">Anteil vom Gewinn als Rücklage (z. B. 30).</p>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-700 font-medium text-sm">Mollie Fixgebühr (mollie_fixed) in €</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.mollie_fixed}
                  onChange={(e) => setForm((f) => ({ ...f, mollie_fixed: e.target.value }))}
                  className="max-w-[12rem] h-10 border border-neutral-200 bg-white text-neutral-900"
                />
                <p className="text-xs text-neutral-500">Feste Gebühr pro Transaktion (z. B. 0,29).</p>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-700 font-medium text-sm">Mollie Prozentsatz (mollie_percent)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.mollie_percent}
                  onChange={(e) => setForm((f) => ({ ...f, mollie_percent: e.target.value }))}
                  className="max-w-[12rem] h-10 border border-neutral-200 bg-white text-neutral-900"
                />
                <p className="text-xs text-neutral-500">Prozent vom Umsatz pro Transaktion (z. B. 0,25).</p>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-700 font-medium text-sm">Kleinunternehmer-Umsatzgrenze (revenue_limit) in €</Label>
                <Input
                  type="number"
                  min={1}
                  step={100}
                  value={form.revenue_limit}
                  onChange={(e) => setForm((f) => ({ ...f, revenue_limit: e.target.value }))}
                  className="max-w-[12rem] h-10 border border-neutral-200 bg-white text-neutral-900"
                />
                <p className="text-xs text-neutral-500">Grenze für die Umsatz-Warnung im Dashboard (z. B. 22.500).</p>
              </div>
            </div>
            <div className="pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="min-w-[8rem] h-10 border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? ' Speichern…' : ' Speichern'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
