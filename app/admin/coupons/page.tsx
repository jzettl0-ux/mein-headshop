'use client'

import { useState, useEffect } from 'react'
import { TicketPercent, Plus, Loader2, Trash2, Edit } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface Coupon {
  id: string
  discount_code_id: string
  badge_label: string
  budget_eur: number | null
  budget_used_eur: number
  scope: string
  scope_value: string | null
  is_active: boolean
  discount_code?: { code: string; type: string; value: number; min_order_amount: number | null; max_uses: number | null; used_count: number; valid_until: string | null }
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [discountCodes, setDiscountCodes] = useState<{ id: string; code: string; type: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [discountCodeId, setDiscountCodeId] = useState('')
  const [badgeLabel, setBadgeLabel] = useState('')
  const [budgetEur, setBudgetEur] = useState('')
  const [scope, setScope] = useState<'all' | 'category' | 'product'>('all')
  const [scopeValue, setScopeValue] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = async () => {
    const [cRes, dcRes] = await Promise.all([
      fetch('/api/admin/coupons').then((r) => (r.ok ? r.json() : [])),
      supabase.from('discount_codes').select('id, code, type, value').order('code'),
    ])
    setCoupons(Array.isArray(cRes) ? cRes : [])
    setDiscountCodes((dcRes.data ?? []).map((r) => ({ id: r.id, code: r.code, type: r.type, value: r.value })))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openNew = () => {
    setEditingId(null)
    setDiscountCodeId('')
    setBadgeLabel('')
    setBudgetEur('')
    setScope('all')
    setScopeValue('')
    setIsActive(true)
    setDialogOpen(true)
  }

  const openEdit = (c: Coupon) => {
    setEditingId(c.id)
    setDiscountCodeId(c.discount_code_id)
    setBadgeLabel(c.badge_label)
    setBudgetEur(c.budget_eur != null ? String(c.budget_eur) : '')
    setScope((c.scope as 'all' | 'category' | 'product') || 'all')
    setScopeValue(c.scope_value ?? '')
    setIsActive(c.is_active)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!badgeLabel.trim()) {
      toast({ title: 'Badge-Label erforderlich', variant: 'destructive' })
      return
    }
    if (!editingId && !discountCodeId) {
      toast({ title: 'Rabattcode wählen', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons'
      const method = editingId ? 'PATCH' : 'POST'
      const body: Record<string, unknown> = {
        badge_label: badgeLabel.trim(),
        budget_eur: budgetEur.trim() ? parseFloat(budgetEur.replace(',', '.')) : null,
        scope,
        scope_value: scope === 'all' ? null : scopeValue.trim() || null,
        is_active: isActive,
      }
      if (!editingId) body.discount_code_id = discountCodeId
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: editingId ? 'Aktualisiert' : 'Voucher angelegt' })
      setDialogOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Voucher-Coupon entfernen?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setCoupons((prev) => prev.filter((c) => c.id !== id))
      toast({ title: 'Entfernt' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const usedIds = new Set(coupons.map((c) => c.discount_code_id))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TicketPercent className="w-7 h-7 text-luxe-gold" />
            Voucher Badges (Klickbare Coupons)
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Klickbare Badges in Suchergebnissen, Budget-Deckelung. Verknüpft mit Rabattcodes.
          </p>
        </div>
        <Button variant="luxe" onClick={openNew}>
          <Plus className="w-5 h-5 mr-2" />
          Voucher anlegen
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : coupons.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <TicketPercent className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine Voucher-Badges.</p>
            <Button variant="luxe" className="mt-4" onClick={openNew}>
              Ersten Voucher anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {coupons.map((c) => (
            <Card key={c.id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{c.badge_label}</p>
                  <p className="text-sm text-luxe-silver">
                    Code: <span className="font-mono text-luxe-gold">{c.discount_code?.code ?? '–'}</span>
                    {c.scope !== 'all' && ` · ${c.scope}: ${c.scope_value ?? '–'}`}
                  </p>
                  <div className="flex gap-2 mt-1">
                    {c.budget_eur != null ? (
                      <Badge variant="secondary">
                        Budget: {formatPrice(Number(c.budget_used_eur ?? 0))} / {formatPrice(c.budget_eur)}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Kein Budget-Limit</Badge>
                    )}
                    <Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Aktiv' : 'Inaktiv'}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="admin-outline" size="sm" onClick={() => openEdit(c)}>
                    <Edit className="w-4 h-4 mr-1" /> Bearbeiten
                  </Button>
                  <Button variant="admin-outline" size="sm" className="text-red-400" onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Voucher bearbeiten' : 'Voucher anlegen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingId && (
              <div>
                <Label className="text-luxe-silver">Rabattcode *</Label>
                <select
                  value={discountCodeId}
                  onChange={(e) => setDiscountCodeId(e.target.value)}
                  className="mt-1 w-full rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
                >
                  <option value="">– Wählen –</option>
                  {discountCodes.filter((dc) => !usedIds.has(dc.id)).map((dc) => (
                    <option key={dc.id} value={dc.id}>
                      {dc.code} ({dc.type === 'percent' ? dc.value + '%' : dc.value + ' €'})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label className="text-luxe-silver">Badge-Label *</Label>
              <Input value={badgeLabel} onChange={(e) => setBadgeLabel(e.target.value)} placeholder="z. B. 5 € sparen" className="bg-luxe-black border-luxe-gray text-white mt-1" />
            </div>
            <div>
              <Label className="text-luxe-silver">Budget (€) – leer = kein Limit</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={budgetEur}
                onChange={(e) => setBudgetEur(e.target.value)}
                placeholder="z. B. 500"
                className="bg-luxe-black border-luxe-gray text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-luxe-silver">Anzeigebereich</Label>
              <select value={scope} onChange={(e) => setScope(e.target.value as 'all' | 'category' | 'product')} className="mt-1 w-full rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white">
                <option value="all">Überall</option>
                <option value="category">Nur Kategorie</option>
                <option value="product">Nur Produkt</option>
              </select>
              {scope !== 'all' && (
                <Input
                  value={scopeValue}
                  onChange={(e) => setScopeValue(e.target.value)}
                  placeholder={scope === 'category' ? 'Kategorie-Slug (z. B. bongs)' : 'Produkt-UUID'}
                  className="bg-luxe-black border-luxe-gray text-white mt-2"
                />
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded text-luxe-gold" />
              <span className="text-sm text-luxe-silver">Aktiv</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-luxe-silver">Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving} variant="luxe">{saving ? 'Wird gespeichert…' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
