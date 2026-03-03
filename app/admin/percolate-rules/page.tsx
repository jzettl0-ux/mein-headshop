'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Plus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function AdminPercolateRulesPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ illegal_keyword: '', action: 'BLOCK' })
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/percolate-rules')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
  }

  useEffect(() => {
    load()
    setLoading(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.illegal_keyword.trim()) {
      toast({ title: 'Verbots-Suchbegriff erforderlich', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/percolate-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Fehler')
      }
      load()
      setForm({ illegal_keyword: '', action: 'BLOCK' })
      setShowForm(false)
      toast({ title: 'Regel angelegt' })
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Regel wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/percolate-rules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      load()
      toast({ title: 'Gelöscht' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-luxe-gold" />
            Compliance-Filter (CanG-Wächter)
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Verbots-Suchbegriffe – Produkte werden vor Indexierung geprüft
          </p>
        </div>
        <Button variant="luxe" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Neue Regel'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Verbots-Suchbegriff</label>
                <input
                  type="text"
                  value={form.illegal_keyword}
                  onChange={(e) => setForm((f) => ({ ...f, illegal_keyword: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                  placeholder="z.B. 10-OH-HHC, THC > 0.3%"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Aktion</label>
                <select
                  value={form.action}
                  onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                >
                  <option value="BLOCK">Blockieren</option>
                  <option value="FLAG_FOR_REVIEW">Zur Prüfung markieren</option>
                </select>
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
            <ShieldAlert className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine Compliance-Regeln.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((r) => (
            <Card key={r.rule_id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="py-3 flex flex-row items-center justify-between">
                <p className="font-mono text-white">{r.illegal_keyword}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={r.action === 'BLOCK' ? 'destructive' : 'secondary'}>
                    {r.action}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400"
                    onClick={() => handleDelete(r.rule_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
