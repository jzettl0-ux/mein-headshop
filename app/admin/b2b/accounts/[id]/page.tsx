'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Loader2, Shield, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

const POLICY_TYPES = [
  { value: 'ORDER_LIMIT', label: 'Bestelllimit (€)' },
  { value: 'RESTRICTED_CATEGORY', label: 'Kategorie eingeschränkt' },
  { value: 'PREFERRED_VENDOR', label: 'Bevorzugter Anbieter' },
] as const
const ACTIONS = [
  { value: 'BLOCK', label: 'Blockieren' },
  { value: 'REQUIRE_APPROVAL', label: 'Freigabe erforderlich' },
  { value: 'WARN_ONLY', label: 'Nur Warnung' },
] as const

export default function AdminB2BAccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [account, setAccount] = useState<any>(null)
  const [policies, setPolicies] = useState<any[]>([])
  const [categories, setCategories] = useState<{ id: string; slug: string; name: string }[]>([])
  const [vendors, setVendors] = useState<{ id: string; company_name?: string; business_name?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ policy_type: 'ORDER_LIMIT', policy_value: '', target_category_id: '', target_vendor_id: '', action_on_violation: 'REQUIRE_APPROVAL' })
  const { toast } = useToast()

  useEffect(() => {
    if (!id) return
    fetch('/api/admin/b2b/accounts')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const a = Array.isArray(data) ? data.find((x: { id: string }) => x.id === id) : null
        setAccount(a ?? null)
      })
      .catch(() => setAccount(null))
  }, [id])

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/b2b/policies?b2b_account_id=${id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPolicies(Array.isArray(data) ? data : []))
      .catch(() => setPolicies([]))
  }, [id])

  useEffect(() => {
    fetch('/api/admin/categories').then((r) => (r.ok ? r.json() : [])).then((d) => setCategories(Array.isArray(d) ? d : []))
    fetch('/api/admin/vendors').then((r) => (r.ok ? r.json() : [])).catch(() => []).then((d) => setVendors(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => { setLoading(!account && !!id) }, [account, id])

  const handleAddPolicy = async () => {
    if (form.policy_type === 'ORDER_LIMIT' && (!form.policy_value || Number(form.policy_value) < 0)) {
      toast({ title: 'Limit in € angeben', variant: 'destructive' })
      return
    }
    if (form.policy_type === 'RESTRICTED_CATEGORY' && !form.target_category_id) {
      toast({ title: 'Kategorie wählen', variant: 'destructive' })
      return
    }
    if (form.policy_type === 'PREFERRED_VENDOR' && !form.target_vendor_id) {
      toast({ title: 'Anbieter wählen', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/admin/b2b/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          b2b_account_id: id,
          policy_type: form.policy_type,
          policy_value: form.policy_type === 'ORDER_LIMIT' ? Number(form.policy_value) : undefined,
          target_category_id: form.policy_type === 'RESTRICTED_CATEGORY' ? form.target_category_id : undefined,
          target_vendor_id: form.policy_type === 'PREFERRED_VENDOR' ? form.target_vendor_id : undefined,
          action_on_violation: form.action_on_violation,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPolicies((prev) => [...prev, data])
      setForm({ policy_type: 'ORDER_LIMIT', policy_value: '', target_category_id: '', target_vendor_id: '', action_on_violation: 'REQUIRE_APPROVAL' })
      setShowForm(false)
      toast({ title: 'Richtlinie hinzugefügt' })
    } catch (e) {
      toast({ title: 'Fehler', description: (e as Error).message, variant: 'destructive' })
    }
  }

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Richtlinie wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/b2b/policies/${policyId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setPolicies((prev) => prev.filter((p) => p.policy_id !== policyId))
      toast({ title: 'Richtlinie gelöscht' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  if (loading || !account) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-luxe-gold" />
            {account.company_name}
          </h1>
          <p className="text-luxe-silver text-sm mt-1">USt-IdNr. {account.vat_id || '–'} · {formatDate(account.created_at)}</p>
          <Badge variant={account.status === 'approved' ? 'default' : 'secondary'} className="mt-2">
            {account.status === 'approved' ? 'Freigegeben' : account.status}
          </Badge>
        </div>
        <Link href="/admin/b2b">
          <Button variant="admin-outline">← Zurück</Button>
        </Link>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-luxe-gold" />
            Einkaufsrichtlinien (Guided Buying)
          </CardTitle>
          {account.status === 'approved' && (
            <Button variant="luxe" size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-1" /> Hinzufügen
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <div className="p-4 rounded-lg border border-luxe-gray bg-luxe-black/50 space-y-3">
              <select
                value={form.policy_type}
                onChange={(e) => setForm((f) => ({ ...f, policy_type: e.target.value as typeof form.policy_type }))}
                className="w-full rounded bg-luxe-gray border border-luxe-silver px-3 py-2 text-white"
              >
                {POLICY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {form.policy_type === 'ORDER_LIMIT' && (
                <input
                  type="number"
                  placeholder="Max. Bestellwert (€)"
                  value={form.policy_value}
                  onChange={(e) => setForm((f) => ({ ...f, policy_value: e.target.value }))}
                  className="w-full rounded bg-luxe-gray border border-luxe-silver px-3 py-2 text-white"
                />
              )}
              {form.policy_type === 'RESTRICTED_CATEGORY' && (
                <select
                  value={form.target_category_id}
                  onChange={(e) => setForm((f) => ({ ...f, target_category_id: e.target.value }))}
                  className="w-full rounded bg-luxe-gray border border-luxe-silver px-3 py-2 text-white"
                >
                  <option value="">Kategorie wählen</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>
                  ))}
                </select>
              )}
              {form.policy_type === 'PREFERRED_VENDOR' && (
                <select
                  value={form.target_vendor_id}
                  onChange={(e) => setForm((f) => ({ ...f, target_vendor_id: e.target.value }))}
                  className="w-full rounded bg-luxe-gray border border-luxe-silver px-3 py-2 text-white"
                >
                  <option value="">Anbieter wählen</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.company_name || v.business_name || v.id.slice(0, 8)}</option>
                  ))}
                </select>
              )}
              <select
                value={form.action_on_violation}
                onChange={(e) => setForm((f) => ({ ...f, action_on_violation: e.target.value as typeof form.action_on_violation }))}
                className="w-full rounded bg-luxe-gray border border-luxe-silver px-3 py-2 text-white"
              >
                {ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button size="sm" variant="luxe" onClick={handleAddPolicy}>Speichern</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Abbrechen</Button>
              </div>
            </div>
          )}
          {policies.length === 0 ? (
            <p className="text-luxe-silver text-sm">Keine Richtlinien. Bei Freigabe-Konten können Limits und Kategorie-Einschränkungen gesetzt werden.</p>
          ) : (
            <ul className="space-y-2">
              {policies.map((p) => (
                <li key={p.policy_id} className="flex items-center justify-between gap-4 p-3 rounded bg-luxe-gray">
                  <span className="text-white">
                    {p.policy_type_label} · {p.policy_value != null && p.policy_type === 'ORDER_LIMIT' && `${p.policy_value} €`}
                    {p.product_categories && ` · ${(p.product_categories as { name?: string }).name}`}
                    {p.target_vendor_id && ` · Vendor ${String(p.target_vendor_id).slice(0, 8)}…`}
                    {' · '}
                    <Badge variant="secondary" className="ml-1">{p.action_label}</Badge>
                  </span>
                  <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDeletePolicy(p.policy_id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
