'use client'

import { useState, useEffect } from 'react'
import { Gift, Award, Loader2, Save, Coins, Sparkles, ToggleLeft, ToggleRight, RefreshCw, TrendingUp, BarChart3, Percent, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { LoyaltySettings } from '@/lib/loyalty'

type CustomerRow = {
  user_id: string
  points_balance: number
  tier: string
  email: string | null
}

type LoyaltyStats = {
  totalRevenue: number
  revenueWithLoyalty: number
  loyaltySharePercent: number
  ordersWithLoyalty: number
  totalOrdersPaid: number
  totalPointsRedeemedEuro: number
  totalTierDiscountEuro: number
  totalLoyaltyDiscounts: number
  thisMonth: {
    revenue: number
    loyaltyRevenue: number
    loyaltySharePercent: number
    ordersWithLoyalty: number
    pointsRedeemedEuro: number
    tierDiscountEuro: number
  }
  tierDistribution: { bronze: number; silver: number; gold: number }
  totalPointsGiven: number
}

const tierLabel: Record<string, string> = { bronze: 'Bronze', silver: 'Silber', gold: 'Gold' }

function formatPrice(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)
}

export default function AdminLoyaltyPage() {
  const [topCustomers, setTopCustomers] = useState<CustomerRow[]>([])
  const [settings, setSettings] = useState<LoyaltySettings | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [stats, setStats] = useState<LoyaltyStats | null>(null)
  const { toast } = useToast()

  const refetch = () => {
    fetch('/api/admin/loyalty/stats').then((r) => (r.ok ? r.json() : null)).then((d) => d && setStats(d))
    fetch('/api/admin/loyalty')
      .then((r) => (r.ok ? r.json() : { topCustomers: [], settings: null }))
      .then((d) => {
        setTopCustomers(d.topCustomers ?? [])
        setSettings(d.settings ?? null)
        if (d.settings) {
          setForm((f) => ({
            ...f,
            enabled: d.settings.enabled ? '1' : '0',
            points_per_euro: String(d.settings.points_per_euro),
            points_per_review: String(d.settings.points_per_review),
            points_per_eur_discount: String(d.settings.points_per_eur_discount),
            silver_min_points: String(d.settings.silver_min_points),
            gold_min_points: String(d.settings.gold_min_points),
            silver_discount_percent: String(d.settings.silver_discount_percent),
            gold_discount_percent: String(d.settings.gold_discount_percent),
            min_order_eur_for_discount: String(d.settings.min_order_eur_for_discount ?? 0),
          }))
        }
      })
      .catch(() => toast({ title: 'Laden fehlgeschlagen', variant: 'destructive' }))
  }

  const handleRecalculateTiers = () => {
    setRecalculating(true)
    fetch('/api/admin/loyalty/recalculate', { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) {
          toast({ title: `${d.updated ?? 0} Kundentiers neu berechnet` })
          refetch()
        } else {
          toast({ title: 'Fehler beim Neuberechnen', variant: 'destructive' })
        }
      })
      .catch(() => toast({ title: 'Fehler beim Neuberechnen', variant: 'destructive' }))
      .finally(() => setRecalculating(false))
  }

  useEffect(() => {
    fetch('/api/admin/loyalty/stats').then((r) => (r.ok ? r.json() : null)).then((d) => d && setStats(d))
    fetch('/api/admin/loyalty')
      .then((r) => (r.ok ? r.json() : { topCustomers: [], settings: null }))
      .then((d) => {
        setTopCustomers(d.topCustomers ?? [])
        setSettings(d.settings ?? null)
        if (d.settings) {
          setForm({
            enabled: d.settings.enabled ? '1' : '0',
            points_per_euro: String(d.settings.points_per_euro),
            points_per_review: String(d.settings.points_per_review),
            points_per_eur_discount: String(d.settings.points_per_eur_discount),
            silver_min_points: String(d.settings.silver_min_points),
            gold_min_points: String(d.settings.gold_min_points),
            silver_discount_percent: String(d.settings.silver_discount_percent),
            gold_discount_percent: String(d.settings.gold_discount_percent),
            min_order_eur_for_discount: String(d.settings.min_order_eur_for_discount ?? 0),
          })
        }
      })
      .catch(() => toast({ title: 'Laden fehlgeschlagen', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [toast])

  const patchSettings = (payload: Record<string, number | boolean>) =>
    fetch('/api/admin/loyalty', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) {
          setSettings(d.settings)
          setForm((f) => ({
            ...f,
            enabled: d.settings.enabled ? '1' : '0',
            points_per_euro: String(d.settings.points_per_euro),
            points_per_review: String(d.settings.points_per_review),
            points_per_eur_discount: String(d.settings.points_per_eur_discount),
            silver_min_points: String(d.settings.silver_min_points),
            gold_min_points: String(d.settings.gold_min_points),
            silver_discount_percent: String(d.settings.silver_discount_percent),
            gold_discount_percent: String(d.settings.gold_discount_percent),
            min_order_eur_for_discount: String(d.settings.min_order_eur_for_discount ?? 0),
          }))
          refetch()
          return true
        }
        return false
      })

  const handleToggleEnabled = () => {
    const nextEnabled = !(form.enabled === '1' || form.enabled === 'true')
    setForm((f) => ({ ...f, enabled: nextEnabled ? '1' : '0' }))
    setSaving(true)
    patchSettings({ enabled: nextEnabled })
      .then((ok) => {
        if (ok) toast({ title: nextEnabled ? 'Treue-Programm aktiviert' : 'Treue-Programm deaktiviert' })
        else toast({ title: 'Speichern fehlgeschlagen', variant: 'destructive' })
      })
      .catch(() => toast({ title: 'Speichern fehlgeschlagen', variant: 'destructive' }))
      .finally(() => setSaving(false))
  }

  const handleSave = () => {
    setSaving(true)
    const payload: Record<string, number | boolean> = {}
    if (form.enabled !== undefined) payload.enabled = form.enabled === '1' || form.enabled === 'true'
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'enabled') return
      const n = Number(v)
      if (Number.isFinite(n) && n >= 0) payload[k] = n
    })
    patchSettings(payload)
      .then((ok) => {
        if (ok) toast({ title: 'Einstellungen gespeichert' })
        else toast({ title: 'Speichern fehlgeschlagen', variant: 'destructive' })
      })
      .catch(() => toast({ title: 'Speichern fehlgeschlagen', variant: 'destructive' }))
      .finally(() => setSaving(false))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-luxe-gold animate-spin" />
      </div>
    )
  }

  const isEnabled = settings?.enabled ?? (form.enabled === '1' || form.enabled === 'true')

  return (
    <div className="space-y-8">
      {/* Header + Ein/Aus */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gift className="w-7 h-7 text-luxe-gold" />
            Treue & Punkte
          </h1>
          <p className="text-luxe-silver mt-1">
            Punkte-Vergabe, Stufen und Rabatte für deine treuesten Kunden.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-luxe-gray bg-luxe-black/50 px-4 py-3">
          <button
            type="button"
            onClick={handleToggleEnabled}
            disabled={saving}
            className="flex items-center gap-2 text-white hover:opacity-90 disabled:opacity-60"
          >
            {isEnabled ? <ToggleRight className="w-8 h-8 text-luxe-gold" /> : <ToggleLeft className="w-8 h-8 text-luxe-silver" />}
            <span className="font-medium">{isEnabled ? 'Programm aktiv' : 'Programm aus'}</span>
          </button>
          {saving && <Loader2 className="w-5 h-5 animate-spin text-luxe-gold shrink-0" />}
        </div>
      </div>

      {!isEnabled && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-amber-200">
          <p className="font-medium">Treue-Programm ist ausgeschaltet</p>
          <p className="text-sm text-amber-200/80 mt-1">
            Kunden sehen keine Punkte, es werden keine vergeben und Rabatte sind deaktiviert.
          </p>
        </div>
      )}

      {/* Umsatz & Impact Statistik */}
      {stats && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-luxe-gold" />
              Umsatz-Impact
            </CardTitle>
            <CardDescription className="text-luxe-silver">
              Welchen Einfluss das Treueprogramm auf deinen Umsatz hat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray">
                <div className="flex items-center gap-2 text-luxe-silver text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Umsatz mit Treue-Nutzung
                </div>
                <p className="text-xl font-bold text-luxe-gold">{formatPrice(stats.revenueWithLoyalty)}</p>
                <p className="text-xs text-luxe-silver mt-1">
                  {stats.ordersWithLoyalty} von {stats.totalOrdersPaid} Bestellungen ({stats.loyaltySharePercent}%)
                </p>
              </div>
              <div className="p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray">
                <div className="flex items-center gap-2 text-luxe-silver text-sm mb-1">
                  <Percent className="w-4 h-4" />
                  Rabatte durch Punkte
                </div>
                <p className="text-xl font-bold text-white">{formatPrice(stats.totalPointsRedeemedEuro)}</p>
                <p className="text-xs text-luxe-silver mt-1">Gesamt eingelöste Punkte (€)</p>
              </div>
              <div className="p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray">
                <div className="flex items-center gap-2 text-luxe-silver text-sm mb-1">
                  <Sparkles className="w-4 h-4" />
                  Rabatte durch Stufen
                </div>
                <p className="text-xl font-bold text-white">{formatPrice(stats.totalTierDiscountEuro)}</p>
                <p className="text-xs text-luxe-silver mt-1">Silber- & Gold-Rabatte</p>
              </div>
              <div className="p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray">
                <div className="flex items-center gap-2 text-luxe-silver text-sm mb-1">
                  <Users className="w-4 h-4" />
                  Stufen-Verteilung
                </div>
                <p className="text-sm font-medium text-white">
                  {tierLabel.bronze}: {stats.tierDistribution.bronze} · {tierLabel.silver}: {stats.tierDistribution.silver} · {tierLabel.gold}: {stats.tierDistribution.gold}
                </p>
                <p className="text-xs text-luxe-silver mt-1">Kunden mit Konto</p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-luxe-gold/10 border border-luxe-gold/30">
              <p className="text-sm font-medium text-luxe-gold">Dieser Monat</p>
              <p className="text-luxe-silver text-sm mt-1">
                {formatPrice(stats.thisMonth.revenue)} Gesamtumsatz · {formatPrice(stats.thisMonth.loyaltyRevenue)} mit Treue ({stats.thisMonth.loyaltySharePercent}%) · 
                {formatPrice(stats.thisMonth.pointsRedeemedEuro)} Punkte + {formatPrice(stats.thisMonth.tierDiscountEuro)} Stufen-Rabatt
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top-Kunden */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-luxe-gold" />
                Top-Kunden nach Punkten
              </CardTitle>
              <CardDescription className="text-luxe-silver">
                Die 50 Kunden mit den meisten Treue-Punkten (sortiert absteigend)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculateTiers}
              disabled={recalculating}
              className="border-luxe-gray text-luxe-silver hover:bg-luxe-gray/30"
            >
              {recalculating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
              Stufen neu berechnen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {topCustomers.length === 0 ? (
            <p className="text-luxe-silver py-6">Noch keine Treue-Konten vorhanden.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-luxe-gray">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-luxe-black/50 text-left text-luxe-silver">
                    <th className="py-3 px-4 font-medium">Platz</th>
                    <th className="py-3 px-4 font-medium">E-Mail</th>
                    <th className="py-3 px-4 font-medium text-right">Punkte</th>
                    <th className="py-3 px-4 font-medium">Stufe</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c, i) => (
                    <tr key={c.user_id} className="border-t border-luxe-gray/50 hover:bg-luxe-gray/20">
                      <td className="py-3 px-4 text-luxe-silver w-16">
                        {i + 1 <= 3 ? (
                          <span className={`font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : 'text-amber-700'}`}>
                            {i + 1}.
                          </span>
                        ) : (
                          i + 1
                        )}
                      </td>
                      <td className="py-3 px-4 text-white font-medium">{c.email ?? c.user_id}</td>
                      <td className="py-3 px-4 text-right font-semibold text-luxe-gold">{c.points_balance.toLocaleString('de-DE')}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
                            c.tier === 'gold'
                              ? 'bg-amber-600/40 text-amber-100 border-amber-500/50'
                              : c.tier === 'silver'
                                ? 'bg-zinc-600/80 text-white border-zinc-500/60'
                                : 'bg-amber-900/60 text-amber-200 border-amber-700/50'
                          }`}
                        >
                          {c.tier === 'gold' && <Sparkles className="w-3.5 h-3.5" />}
                          {tierLabel[c.tier] ?? c.tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Einstellungen – gruppiert in logische Bereiche */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-luxe-gold" />
            Einstellungen
          </CardTitle>
          <CardDescription className="text-luxe-silver">
            Punkte-Vergabe, Einlösung und Stufen anpassen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* 1. Punkte sammeln */}
          <div>
            <h3 className="text-white font-semibold mb-3 pb-2 border-b border-luxe-gray">
              1. Punkte sammeln (Vergabe)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-luxe-silver">Punkte pro 1 € Umsatz</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.points_per_euro ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, points_per_euro: e.target.value }))}
                  className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                  placeholder="z. B. 1"
                />
              </div>
              <div>
                <Label className="text-luxe-silver">Punkte pro genehmigte Bewertung</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.points_per_review ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, points_per_review: e.target.value }))}
                  className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                  placeholder="z. B. 50"
                />
              </div>
            </div>
          </div>

          {/* 2. Punkte einlösen */}
          <div>
            <h3 className="text-white font-semibold mb-3 pb-2 border-b border-luxe-gray">
              2. Punkte einlösen
            </h3>
            <div className="max-w-xs">
              <Label className="text-luxe-silver">Punkte für 1 € Rabatt</Label>
              <Input
                type="number"
                min={1}
                value={form.points_per_eur_discount ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, points_per_eur_discount: e.target.value }))}
                className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                placeholder="z. B. 100"
              />
              <p className="text-luxe-silver text-xs mt-1">
                Wie viele Punkte der Kunde für 1 € Rabatt einlösen muss
              </p>
            </div>
          </div>

          {/* 3. Stufen (Silber / Gold) */}
          <div>
            <h3 className="text-white font-semibold mb-3 pb-2 border-b border-luxe-gray">
              3. Stufen & Rabatte
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-luxe-silver">Silber ab (Punkte)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.silver_min_points ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, silver_min_points: e.target.value }))}
                  className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                  placeholder="z. B. 500"
                />
              </div>
              <div>
                <Label className="text-luxe-silver">Silber-Rabatt (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.silver_discount_percent ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, silver_discount_percent: e.target.value }))}
                  className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                  placeholder="z. B. 5"
                />
              </div>
              <div>
                <Label className="text-luxe-silver">Gold ab (Punkte)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.gold_min_points ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, gold_min_points: e.target.value }))}
                  className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                  placeholder="z. B. 2000"
                />
              </div>
              <div>
                <Label className="text-luxe-silver">Gold-Rabatt (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.gold_discount_percent ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, gold_discount_percent: e.target.value }))}
                  className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                  placeholder="z. B. 10"
                />
              </div>
            </div>
            <div className="mt-4 max-w-xs">
              <Label className="text-luxe-silver">Mindestbestellwert für Stufen-Rabatt (€)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={form.min_order_eur_for_discount ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, min_order_eur_for_discount: e.target.value }))}
                className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                placeholder="z. B. 30"
              />
              <p className="text-luxe-silver text-xs mt-1">
                0 = Rabatt immer. Sonst erst ab diesem Warenkorbwert.
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} variant="luxe">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Einstellungen speichern
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
