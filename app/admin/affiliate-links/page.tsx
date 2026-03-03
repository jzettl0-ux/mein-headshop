'use client'

import { useState, useEffect } from 'react'
import { Link2, Plus, Loader2, Trash2, Edit, Copy, Euro, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

type AffiliateLink = {
  id: string
  code: string
  partner_name: string
  partner_email: string | null
  commission_percent: number
  cookie_days: number
  is_active: boolean
  created_at: string
}

type Commission = {
  id: string
  order_total: number
  commission_eur: number
  status: string
  created_at: string
  affiliate_links?: { code: string; partner_name: string }
  orders?: { order_number: string; total: number; customer_email: string }
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''

export default function AdminAffiliateLinksPage() {
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')
  const [commissionPercent, setCommissionPercent] = useState('5')
  const [cookieDays, setCookieDays] = useState('30')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = async () => {
    try {
      const [linksRes, commissionsRes] = await Promise.all([
        fetch('/api/admin/affiliate-links'),
        fetch('/api/admin/affiliate-commissions'),
      ])
      setLinks(linksRes.ok ? await linksRes.json() : [])
      setCommissions(commissionsRes.ok ? await commissionsRes.json() : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditingId(null)
    setCode('')
    setPartnerName('')
    setPartnerEmail('')
    setCommissionPercent('5')
    setCookieDays('30')
    setIsActive(true)
    setDialogOpen(true)
  }

  const openEdit = (l: AffiliateLink) => {
    setEditingId(l.id)
    setCode(l.code)
    setPartnerName(l.partner_name)
    setPartnerEmail(l.partner_email ?? '')
    setCommissionPercent(String(l.commission_percent ?? 5))
    setCookieDays(String(l.cookie_days ?? 30))
    setIsActive(l.is_active)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const codeStr = code.trim().toUpperCase()
    const nameStr = partnerName.trim()
    if (!codeStr) { toast({ title: 'Code erforderlich', variant: 'destructive' }); return }
    if (!nameStr) { toast({ title: 'Partner-Name erforderlich', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/affiliate-links/${editingId}` : '/api/admin/affiliate-links'
      const method = editingId ? 'PATCH' : 'POST'
      const body: Record<string, unknown> = {
        partner_name: nameStr,
        partner_email: partnerEmail.trim() || null,
        commission_percent: parseFloat(commissionPercent.replace(',', '.')) || 5,
        cookie_days: Math.max(1, Math.min(365, parseInt(cookieDays, 10) || 30)),
        is_active: isActive,
      }
      if (!editingId) body.code = codeStr
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
      toast({ title: editingId ? 'Aktualisiert' : 'Affiliate-Link angelegt' })
      setDialogOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Affiliate-Link entfernen? Verknüpfte Provisionen bleiben erhalten.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/affiliate-links/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setLinks((prev) => prev.filter((l) => l.id !== id))
      toast({ title: 'Entfernt' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const copyLink = (c: string) => {
    const url = `${BASE_URL}?aff=${c}`
    navigator.clipboard.writeText(url)
    toast({ title: 'Link kopiert', description: url })
  }

  const totalPending = commissions
    .filter((c) => c.status === 'pending')
    .reduce((s, c) => s + Number(c.commission_eur || 0), 0)
  const totalPaid = commissions
    .filter((c) => c.status === 'paid')
    .reduce((s, c) => s + Number(c.commission_eur || 0), 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-7 h-7 text-luxe-gold" />
            Affiliate / PartnerNet
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Partner-Links (?aff=CODE), Provision bei Zahlungseingang
          </p>
        </div>
        <Button variant="luxe" onClick={openNew}>
          <Plus className="w-5 h-5 mr-2" />
          Affiliate-Link anlegen
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatPrice(totalPending)}</p>
                <p className="text-sm text-luxe-silver">Offene Provisionen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Euro className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatPrice(totalPaid)}</p>
                <p className="text-sm text-luxe-silver">Ausbezahlt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : links.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <Link2 className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine Affiliate-Links.</p>
            <Button variant="luxe" className="mt-4" onClick={openNew}>
              Ersten Affiliate-Link anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {links.map((l) => (
            <Card key={l.id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{l.partner_name}</p>
                  <p className="text-sm text-luxe-silver">
                    Code: <span className="font-mono text-luxe-gold">{l.code}</span>
                    {l.partner_email && ` · ${l.partner_email}`}
                  </p>
                  <p className="text-xs text-luxe-silver mt-1">
                    {l.commission_percent}% Provision · Cookie: {l.cookie_days} Tage
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={l.is_active ? 'default' : 'secondary'}>{l.is_active ? 'Aktiv' : 'Inaktiv'}</Badge>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-luxe-silver" onClick={() => copyLink(l.code)}>
                      <Copy className="w-3.5 h-3.5 mr-1" /> Link kopieren
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="admin-outline" size="sm" onClick={() => openEdit(l)}>
                    <Edit className="w-4 h-4 mr-1" /> Bearbeiten
                  </Button>
                  <Button variant="admin-outline" size="sm" className="text-red-400" onClick={() => handleDelete(l.id)} disabled={deletingId === l.id}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {commissions.length > 0 && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Euro className="w-5 h-5 text-luxe-gold" />
              Letzte Provisionen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-luxe-gray text-left text-luxe-silver">
                    <th className="pb-3 pr-4">Datum</th>
                    <th className="pb-3 pr-4">Partner</th>
                    <th className="pb-3 pr-4">Bestellung</th>
                    <th className="pb-3 pr-4">Bestellwert</th>
                    <th className="pb-3 pr-4">Provision</th>
                    <th className="pb-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.slice(0, 20).map((c) => (
                    <tr key={c.id} className="border-b border-luxe-gray/70">
                      <td className="py-3 pr-4 text-luxe-silver">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('de-DE', { dateStyle: 'short' }) : '–'}
                      </td>
                      <td className="py-3 pr-4 text-white">{c.affiliate_links?.partner_name ?? c.affiliate_links?.code ?? '–'}</td>
                      <td className="py-3 pr-4 font-mono text-luxe-silver">#{c.orders?.order_number ?? '–'}</td>
                      <td className="py-3 pr-4 text-luxe-silver">{formatPrice(Number(c.order_total))}</td>
                      <td className="py-3 pr-4 text-luxe-gold font-medium">{formatPrice(Number(c.commission_eur))}</td>
                      <td>
                        <Badge variant={c.status === 'paid' ? 'default' : c.status === 'cancelled' ? 'secondary' : 'outline'}>
                          {c.status === 'paid' ? 'Bezahlt' : c.status === 'cancelled' ? 'Storniert' : 'Offen'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Affiliate-Link bearbeiten' : 'Affiliate-Link anlegen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingId && (
              <div>
                <Label className="text-luxe-silver">Code * (z. B. PARTNER1)</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="PARTNER1" className="bg-luxe-black border-luxe-gray text-white mt-1" />
              </div>
            )}
            <div>
              <Label className="text-luxe-silver">Partner-Name *</Label>
              <Input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="Partner XY" className="bg-luxe-black border-luxe-gray text-white mt-1" />
            </div>
            <div>
              <Label className="text-luxe-silver">E-Mail</Label>
              <Input type="email" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} placeholder="partner@example.com" className="bg-luxe-black border-luxe-gray text-white mt-1" />
            </div>
            <div>
              <Label className="text-luxe-silver">Provision (%)</Label>
              <Input type="text" inputMode="decimal" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} placeholder="5" className="bg-luxe-black border-luxe-gray text-white mt-1" />
            </div>
            <div>
              <Label className="text-luxe-silver">Cookie-Laufzeit (Tage)</Label>
              <Input type="number" min={1} max={365} value={cookieDays} onChange={(e) => setCookieDays(e.target.value)} placeholder="30" className="bg-luxe-black border-luxe-gray text-white mt-1" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded text-luxe-gold" />
              <span className="text-sm text-luxe-silver">Aktiv</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-luxe-silver">Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving} variant="luxe">{saving ? 'Speichern…' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
