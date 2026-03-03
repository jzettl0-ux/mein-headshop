'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Loader2, Save, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { DEFAULT_EMPLOYEE_CONTRACT_TEMPLATE } from '@/lib/employee-contract-default'

const CONTRACT_TYPES = [
  { value: '', label: 'Sonstige' },
  { value: 'employee', label: 'Mitarbeitervertrag' },
  { value: 'vendor', label: 'Verkäufer / Lieferant' },
] as const

export default function AdminContractsNewPage() {
  const [slug, setSlug] = useState('')
  const [label, setLabel] = useState('')
  const [contract_type, setContract_type] = useState<string>('')
  const [template_text, setTemplate_text] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const s = slug.trim().toLowerCase().replace(/\s+/g, '-') || label.trim().toLowerCase().replace(/\s+/g, '-')
    const l = label.trim()
    if (!l) {
      toast({ title: 'Label fehlt', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: s || undefined,
          label: l,
          template_text: template_text.trim(),
          contract_type: contract_type || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Speichern fehlgeschlagen')
      }
      const data = await res.json()
      toast({ title: 'Angelegt', description: `Vertrag „${data.label}“ wurde erstellt.` })
      router.push(`/admin/contracts/${data.slug}`)
    } catch (e: unknown) {
      toast({ title: 'Fehler', description: e instanceof Error ? e.message : 'Vertrag konnte nicht angelegt werden.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="text-luxe-silver" asChild>
          <Link href="/admin/contracts">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Zurück
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-7 h-7 text-luxe-gold" />
          Neuer Vertrag
        </h1>
        <p className="text-luxe-silver mt-1">
          Neue Vertragsvorlage anlegen (z. B. Verkäufer, Lieferant, Partner).
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Vertrag anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="label" className="text-luxe-silver">Bezeichnung</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="z. B. Vertrag für Verkäufer"
                className="mt-1 bg-luxe-black border-luxe-gray text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="contract_type" className="text-luxe-silver">Vertragstyp</Label>
              <select
                id="contract_type"
                value={contract_type}
                onChange={(e) => setContract_type(e.target.value)}
                className="mt-1 w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
              >
                {CONTRACT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="slug" className="text-luxe-silver">Slug (URL-Kürzel, optional)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="z. B. verkaeufer-vendor oder mitarbeiter-minijob"
                className="mt-1 bg-luxe-black border-luxe-gray text-white font-mono"
              />
              <p className="text-xs text-luxe-silver/80 mt-1">Leer = automatisch aus Bezeichnung (Kleinbuchstaben, Bindestriche).</p>
            </div>
            {contract_type === 'employee' && (
              <div className="p-3 bg-luxe-gold/10 border border-luxe-gold/30 rounded-lg">
                <p className="text-sm text-luxe-silver mb-2">Du kannst die Standard-Mitarbeitervertrag-Vorlage übernehmen und anpassen (z. B. für Minijob oder Werkstudent).</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-luxe-gold text-luxe-gold"
                  onClick={() => setTemplate_text(DEFAULT_EMPLOYEE_CONTRACT_TEMPLATE)}
                >
                  Standard-Mitarbeitervertrag übernehmen
                </Button>
              </div>
            )}
            <div>
              <Label htmlFor="template_text" className="text-luxe-silver">Vertragstext (Platzhalter: {{company_name}}, {{represented_by}}, …)</Label>
              <Textarea
                id="template_text"
                value={template_text}
                onChange={(e) => setTemplate_text(e.target.value)}
                className="mt-1 min-h-[200px] font-mono text-sm bg-luxe-black border-luxe-gray text-white"
                placeholder="Vertragstext..."
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="luxe" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Anlegen
              </Button>
              <Button type="button" variant="outline" className="border-luxe-gray text-luxe-silver" asChild>
                <Link href="/admin/contracts">Abbrechen</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
