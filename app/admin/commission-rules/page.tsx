'use client'

import { useState, useEffect } from 'react'
import { Calculator, Plus, Loader2, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

type CommissionRule = {
  id: string
  rule_name: string
  category_id: string | null
  vendor_id: string | null
  percentage_fee: number
  fixed_fee: number
  is_active: boolean
  priority: number
  product_categories?: { id: string; slug: string; name: string } | null
  vendor_accounts?: { id: string; company_name: string } | null
}

export default function AdminCommissionRulesPage() {
  const [rules, setRules] = useState<CommissionRule[]>([])
  const [categories, setCategories] = useState<{ id: string; slug: string; name: string }[]>([])
  const [vendors, setVendors] = useState<{ id: string; company_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [ruleName, setRuleName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [percentageFee, setPercentageFee] = useState('15')
  const [fixedFee, setFixedFee] = useState('0')
  const [priority, setPriority] = useState('10')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = async () => {
    try {
      const [rRes, cRes, vRes] = await Promise.all([
        fetch('/api/admin/commission-rules'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/vendors').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ])
      setRules(rRes.ok ? await rRes.json() : [])
      setCategories(cRes.ok ? await cRes.json() : [])
      setVendors(Array.isArray(vRes) ? vRes : [])
    } catch {
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openNew = () => {
    setEditingId(null)
    setRuleName('')
    setCategoryId('')
    setVendorId('')
    setPercentageFee('15')
    setFixedFee('0')
    setPriority('10')
    setIsActive(true)
    setDialogOpen(true)
  }

  const openEdit = (r: CommissionRule) => {
    setEditingId(r.id)
    setRuleName(r.rule_name)
    setCategoryId(r.category_id ?? '')
    setVendorId(r.vendor_id ?? '')
    setPercentageFee(String(r.percentage_fee ?? 15))
    setFixedFee(String(r.fixed_fee ?? 0))
    setPriority(String(r.priority ?? 10))
    setIsActive(r.is_active)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!ruleName.trim()) {
      toast({ title: 'Regelname erforderlich', variant: 'destructive' })
      return
    }
    const pct = parseFloat(percentageFee.replace(',', '.'))
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast({ title: 'Provision 0–100%', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/commission-rules/${editingId}` : '/api/admin/commission-rules'
      const method = editingId ? 'PATCH' : 'POST'
      const body: Record<string, unknown> = {
        rule_name: ruleName.trim(),
        category_id: categoryId || null,
        vendor_id: vendorId || null,
        percentage_fee: pct,
        fixed_fee: parseFloat(fixedFee.replace(',', '.')) || 0,
        priority: parseInt(priority, 10) || 10,
        is_active: isActive,
      }
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
      toast({ title: editingId ? 'Aktualisiert' : 'Regel angelegt' })
      setDialogOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Provisionsregel entfernen?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/commission-rules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Entfernt' })
      load()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-7 h-7 text-luxe-gold" />
            Commission Rules
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Dynamische Provision pro Kategorie/Vendor. Niedrigere Priorität = wird zuerst angewendet.
          </p>
        </div>
        <Button variant="luxe" onClick={openNew}>
          <Plus className="w-5 h-5 mr-2" />
          Regel anlegen
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : rules.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <Calculator className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Keine Provisionsregeln. Standard: 15%</p>
            <Button variant="luxe" className="mt-4" onClick={openNew}>
              Erste Regel anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((r) => (
            <Card key={r.id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{r.rule_name}</p>
                  <p className="text-sm text-luxe-silver">
                    {r.percentage_fee}% Provision
                    {r.fixed_fee ? ` + ${r.fixed_fee} € fest` : ''}
                    {' · Priorität '}
                    {r.priority}
                    {r.product_categories && ` · ${r.product_categories.name}`}
                    {r.vendor_accounts && ` · ${r.vendor_accounts.company_name}`}
                  </p>
                  <Badge variant={r.is_active ? 'default' : 'secondary'} className="mt-2">
                    {r.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="admin-outline" size="sm" onClick={() => openEdit(r)}>
                    <Edit className="w-4 h-4 mr-1" /> Bearbeiten
                  </Button>
                  <Button
                    variant="admin-outline"
                    size="sm"
                    className="text-red-400"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                  >
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
            <DialogTitle>{editingId ? 'Regel bearbeiten' : 'Provisionsregel anlegen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-luxe-silver">Regelname *</Label>
              <Input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="z. B. Standard 15%"
                className="bg-luxe-black border-luxe-gray text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-luxe-silver">Kategorie (optional)</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
              >
                <option value="">– keine –</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-luxe-silver">Vendor (optional)</Label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="mt-1 w-full rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
              >
                <option value="">– keiner (global) –</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-luxe-silver">Provision (%)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={percentageFee}
                onChange={(e) => setPercentageFee(e.target.value)}
                className="bg-luxe-black border-luxe-gray text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-luxe-silver">Feste Gebühr (€, optional)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={fixedFee}
                onChange={(e) => setFixedFee(e.target.value)}
                className="bg-luxe-black border-luxe-gray text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-luxe-silver">Priorität (niedriger = höher)</Label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="bg-luxe-black border-luxe-gray text-white mt-1"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-luxe-gold"
              />
              <span className="text-sm text-luxe-silver">Aktiv</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-luxe-silver">
              Abbrechen
            </Button>
            <Button variant="luxe" onClick={handleSave} disabled={saving}>
              {saving ? 'Speichern…' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
