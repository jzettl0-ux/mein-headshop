'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Plus, Loader2, Trash2, CheckCircle, XCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type GatedCategory = {
  id: string
  category_id: string
  requires_approval: boolean
  min_loyalty_tier_required?: number
  product_categories?: { id: string; slug: string; name: string }
}

type Approval = {
  id: string
  vendor_id: string
  category_id: string
  status: string
  created_at: string
  vendor_accounts?: { company_name: string; contact_email: string }
  product_categories?: { slug: string; name: string }
}

export default function AdminCategoryGatingPage() {
  const [gated, setGated] = useState<GatedCategory[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [categories, setCategories] = useState<{ id: string; slug: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [actingId, setActingId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = async () => {
    try {
      const [gRes, aRes, cRes] = await Promise.all([
        fetch('/api/admin/gated-categories'),
        fetch('/api/admin/vendor-category-approvals' + (filterStatus ? `?status=${filterStatus}` : '')),
        fetch('/api/admin/categories'),
      ])
      setGated(gRes.ok ? await gRes.json() : [])
      setApprovals(aRes.ok ? await aRes.json() : [])
      setCategories(cRes.ok ? await cRes.json() : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filterStatus])

  const availableCategories = categories.filter(
    (c) => !gated.some((g) => g.category_id === c.id)
  )

  const handleAddGated = async () => {
    if (!selectedCategoryId) {
      toast({ title: 'Kategorie wählen', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/gated-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: selectedCategoryId, requires_approval: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'Kategorie als gated hinzugefügt' })
      setDialogOpen(false)
      setSelectedCategoryId('')
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveGated = async (id: string) => {
    if (!confirm('Kategorie aus Gating entfernen?')) return
    const res = await fetch(`/api/admin/gated-categories/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast({ title: 'Fehler', variant: 'destructive' })
      return
    }
    toast({ title: 'Entfernt' })
    load()
  }

  const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActingId(id)
    try {
      const res = await fetch(`/api/admin/vendor-category-approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, review_notes: reviewNotes || undefined }),
      })
      if (!res.ok) {
        toast({ title: 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: status === 'APPROVED' ? 'Freigegeben' : 'Abgelehnt' })
      setReviewNotes('')
      load()
    } finally {
      setActingId(null)
    }
  }

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-luxe-gold" />
          Category Gating
        </h1>
        <p className="text-luxe-silver text-sm mt-1">
          Kategorien mit Genehmigungspflicht für Vendoren verwalten und Freigabe-Anfragen bearbeiten
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : (
        <>
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-luxe-gold" />
                Gated Categories
              </CardTitle>
              <Button
                variant="luxe"
                size="sm"
                onClick={() => setDialogOpen(true)}
                disabled={availableCategories.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Hinzufügen
              </Button>
            </CardHeader>
            <CardContent>
              {gated.length === 0 ? (
                <p className="text-luxe-silver text-sm">Keine gated Categories konfiguriert.</p>
              ) : (
                <div className="space-y-2">
                  {gated.map((g) => (
                    <div
                      key={g.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-lg bg-luxe-black/50 border border-luxe-gray/50"
                    >
                      <span className="text-white font-medium">
                        {g.product_categories?.name ?? g.category_id}
                      </span>
                      <div className="flex items-center gap-2">
                        <select
                          value={g.min_loyalty_tier_required ?? 1}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10)
                            if (v >= 1 && v <= 3) {
                              fetch(`/api/admin/gated-categories/${g.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ min_loyalty_tier_required: v }),
                              })
                                .then((r) => { if (r.ok) load() })
                                .catch(() => toast({ title: 'Fehler', variant: 'destructive' }))
                            }
                          }}
                          className="rounded bg-luxe-black border border-luxe-gray px-2 py-1 text-sm text-white"
                        >
                          <option value={1}>Alle (Bronze+)</option>
                          <option value={2}>Secret Shop (Silber+)</option>
                          <option value={3}>Exklusiv (Gold)</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleRemoveGated(g.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Freigabe-Anfragen</CardTitle>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-sm text-white"
                >
                  <option value="">Alle</option>
                  <option value="PENDING">Offen ({pendingCount})</option>
                  <option value="APPROVED">Freigegeben</option>
                  <option value="REJECTED">Abgelehnt</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {approvals.length === 0 ? (
                <p className="text-luxe-silver text-sm">Keine Freigabe-Anfragen.</p>
              ) : (
                <div className="space-y-3">
                  {approvals.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 rounded-lg bg-luxe-black/50 border border-luxe-gray/50"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {a.vendor_accounts?.company_name ?? a.vendor_id}
                        </p>
                        <p className="text-sm text-luxe-silver">
                          {a.product_categories?.name ?? a.category_id} ·{' '}
                          {new Date(a.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            a.status === 'APPROVED'
                              ? 'default'
                              : a.status === 'REJECTED'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {a.status}
                        </Badge>
                        {a.status === 'PENDING' && (
                          <>
                            <input
                              type="text"
                              placeholder="Notiz (optional)"
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              className="rounded bg-luxe-black border border-luxe-gray px-2 py-1 text-sm text-white w-40"
                            />
                            <Button
                              variant="admin-outline"
                              size="sm"
                              className="text-emerald-400"
                              onClick={() => handleApprove(a.id, 'APPROVED')}
                              disabled={actingId === a.id}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Freigeben
                            </Button>
                            <Button
                              variant="admin-outline"
                              size="sm"
                              className="text-red-400"
                              onClick={() => handleApprove(a.id, 'REJECTED')}
                              disabled={actingId === a.id}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Ablehnen
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Kategorie mit Freigabepflicht hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-luxe-silver">Kategorie</Label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="mt-2 w-full rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
              >
                <option value="">– wählen –</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-luxe-silver">
              Abbrechen
            </Button>
            <Button variant="luxe" onClick={handleAddGated} disabled={saving || !selectedCategoryId}>
              {saving ? 'Speichern…' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
