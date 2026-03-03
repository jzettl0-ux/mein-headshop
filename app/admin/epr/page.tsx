'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Plus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function AdminEPRPage() {
  const [list, setList] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ vendor_id: '', epr_type: 'LUCID_PACKAGING', registration_number: '' })
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/epr-registrations')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/epr-registrations').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/admin/vendors').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([regs, vends]) => {
        setList(Array.isArray(regs) ? regs : [])
        setVendors(Array.isArray(vends) ? vends : vends?.vendors ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vendor_id || !form.registration_number) {
      toast({ title: 'Vendor und Registrierungsnummer erforderlich', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/epr-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Fehler')
      }
      load()
      setForm({ vendor_id: '', epr_type: 'LUCID_PACKAGING', registration_number: '' })
      setShowForm(false)
      toast({ title: 'EPR-Registrierung angelegt' })
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-luxe-gold" />
            EPR-Registrierungen
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            VerpackG, ElektroG, BattG – LUCID, WEEE-Register
          </p>
        </div>
        <Button variant="luxe" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Neue Registrierung'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Vendor</label>
                <select
                  value={form.vendor_id}
                  onChange={(e) => setForm((f) => ({ ...f, vendor_id: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                  required
                >
                  <option value="">Vendor wählen</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.business_name ?? v.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-luxe-silver mb-1">EPR-Typ</label>
                <select
                  value={form.epr_type}
                  onChange={(e) => setForm((f) => ({ ...f, epr_type: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                >
                  <option value="LUCID_PACKAGING">LUCID (VerpackG)</option>
                  <option value="WEEE_ELECTRONICS">WEEE (ElektroG)</option>
                  <option value="BATT_G_BATTERIES">BattG (Batterien)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Registrierungsnummer</label>
                <input
                  type="text"
                  value={form.registration_number}
                  onChange={(e) => setForm((f) => ({ ...f, registration_number: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                  placeholder="z.B. DE12345678901234"
                  required
                />
              </div>
              <Button type="submit" variant="luxe" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Speichern
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : list.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <ShieldCheck className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine EPR-Registrierungen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((r) => (
            <Card key={r.registration_id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="py-3 flex flex-row items-center justify-between">
                <div>
                  <p className="font-medium text-white">
                    {r.vendor_accounts?.business_name ?? r.vendor_id}
                  </p>
                  <p className="text-sm text-luxe-silver">
                    {r.epr_type} · {r.registration_number}
                  </p>
                </div>
                <Badge
                  variant={
                    r.verification_status === 'VALID'
                      ? 'default'
                      : r.verification_status === 'INVALID_SUSPENDED'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {r.verification_status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
