'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Loader2,
  Save,
  Printer,
  FileDown,
  Info,
  Link2,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

const PLACEHOLDER_HINT = `Platzhalter: {{company_name}} {{company_address}} {{company_postal_code}} {{company_city}} {{represented_by}} {{start_date}} {{employee_name}} {{employee_address}} {{job_title}} {{working_hours_week}} {{salary_brutto}} {{account_holder}} {{bank_name}} {{employee_iban}} {{employee_bic}} {{probezeit_monate}} {{contract_end_date}} (Befristung)`

type Contract = {
  id: string
  slug: string
  label: string
  template_text: string
  contract_type?: string | null
  created_at: string
  updated_at: string
}

const CONTRACT_TYPES = [
  { value: '', label: 'Sonstige' },
  { value: 'employee', label: 'Mitarbeitervertrag' },
  { value: 'vendor', label: 'Verkäufer / Lieferant' },
] as const

type Acceptance = {
  id: string
  accepted_by_name: string | null
  accepted_by_email: string
  accepted_at: string
  reference_type: string | null
  reference_id: string | null
}

export default function AdminContractEditPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [contract, setContract] = useState<Contract | null>(null)
  const [label, setLabel] = useState('')
  const [contract_type, setContract_type] = useState<string>('')
  const [template_text, setTemplate_text] = useState('')
  const [acceptances, setAcceptances] = useState<Acceptance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!slug) return
    Promise.all([
      fetch(`/api/admin/contracts/${slug}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/admin/contracts/${slug}/acceptances`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([data, acc]) => {
        if (data) {
          setContract(data)
          setLabel(data.label)
          setContract_type(data.contract_type ?? '')
          setTemplate_text(data.template_text ?? '')
        }
        setAcceptances(Array.isArray(acc) ? acc : [])
      })
      .catch(() => toast({ title: 'Fehler', description: 'Vertrag konnte nicht geladen werden.', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [slug, toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/contracts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, template_text, contract_type: contract_type || null }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      const data = await res.json()
      setContract(data)
      toast({ title: 'Gespeichert', description: 'Vertrag wurde aktualisiert.' })
    } catch {
      toast({ title: 'Fehler', description: 'Vertrag konnte nicht gespeichert werden.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const acceptLink = typeof window !== 'undefined' ? `${window.location.origin}/vertrag/${slug}/bestaetigen` : ''

  if (loading || !contract) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
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
          {contract.label}
        </h1>
        <p className="text-luxe-silver mt-1">Slug: {contract.slug}</p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Vertragstext bearbeiten</CardTitle>
          <p className="text-sm text-luxe-silver font-normal">
            Platzhalter in geschweiften Klammern werden beim PDF/Vorschau und bei der elektronischen Bestätigung ersetzt.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="label" className="text-luxe-silver">Bezeichnung</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 bg-luxe-black border-luxe-gray text-white"
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
          <div className="rounded-lg bg-luxe-black border border-luxe-gray p-3 flex items-start gap-2">
            <Info className="w-5 h-5 text-luxe-silver flex-shrink-0 mt-0.5" />
            <p className="text-sm text-luxe-silver leading-relaxed">{PLACEHOLDER_HINT}</p>
          </div>
          <div>
            <Label htmlFor="template" className="text-luxe-silver sr-only">Vertragstext</Label>
            <Textarea
              id="template"
              value={template_text}
              onChange={(e) => setTemplate_text(e.target.value)}
              className="min-h-[320px] font-mono text-sm bg-luxe-black border-luxe-gray text-white"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="luxe" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Speichern
            </Button>
            <Button
              variant="outline"
              className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10"
              asChild
            >
              <Link href={`/admin/contracts/${slug}/preview`} target="_blank" rel="noopener noreferrer">
                <Printer className="w-4 h-4 mr-2" />
                Vorschau & Drucken
              </Link>
            </Button>
            <Button
              variant="outline"
              className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10"
              onClick={() => {
                window.open(`/api/admin/contracts/${slug}/pdf`, '_blank')
                setPdfLoading(true)
                setTimeout(() => setPdfLoading(false), 2000)
              }}
              disabled={pdfLoading}
            >
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
              Als PDF
            </Button>
            <Button
              variant="outline"
              className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10"
              onClick={() => {
                navigator.clipboard.writeText(acceptLink)
                toast({ title: 'Link kopiert', description: 'Link zur elektronischen Bestätigung in die Zwischenablage kopiert.' })
              }}
            >
              <Link2 className="w-4 h-4 mr-2" />
              Link zur Bestätigung kopieren
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card id="acceptances" className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-luxe-gold" />
            Elektronische Bestätigungen ({acceptances.length})
          </CardTitle>
          <p className="text-sm text-luxe-silver font-normal">
            Wer hat diesen Vertrag wann bestätigt (nur elektronische Bestätigung, kein Ausdruck nötig).
          </p>
        </CardHeader>
        <CardContent>
          {acceptances.length === 0 ? (
            <p className="text-luxe-silver">Bisher keine Bestätigungen. Sende den Link zur Bestätigung an Vertragspartner.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-luxe-gray text-luxe-silver">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">E-Mail</th>
                    <th className="py-2 pr-4">Datum</th>
                    <th className="py-2">Referenz</th>
                  </tr>
                </thead>
                <tbody className="text-luxe-silver">
                  {acceptances.map((a) => (
                    <tr key={a.id} className="border-b border-luxe-gray/50">
                      <td className="py-2 pr-4">{a.accepted_by_name || '–'}</td>
                      <td className="py-2 pr-4">{a.accepted_by_email}</td>
                      <td className="py-2 pr-4">{new Date(a.accepted_at).toLocaleString('de-DE')}</td>
                      <td className="py-2">{a.reference_type && a.reference_id ? `${a.reference_type}: ${a.reference_id}` : '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-luxe-silver/80">
        Vertragstexte rechtlich prüfen lassen. Elektronische Bestätigung kann die schriftliche Unterschrift ersetzen, sofern vertraglich vereinbart.
      </p>
    </div>
  )
}
