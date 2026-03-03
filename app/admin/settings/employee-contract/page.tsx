'use client'

import { useState, useEffect } from 'react'
import { FileText, Loader2, Save, Printer, FileDown, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const PLACEHOLDER_HINT = `Platzhalter (werden beim Drucken/PDF ersetzt):
{{company_name}} {{company_address}} {{company_postal_code}} {{company_city}} {{company_country}} {{company_email}}
{{represented_by}} {{start_date}} {{employee_name}} {{employee_address}}`

export default function AdminEmployeeContractPage() {
  const [template, setTemplate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/employee-contract')
      .then((res) => {
        if (!res.ok) throw new Error('Laden fehlgeschlagen')
        return res.json()
      })
      .then((data) => setTemplate(data.template || ''))
      .catch(() => toast({ title: 'Fehler', description: 'Vertrag konnte nicht geladen werden.', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/employee-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      toast({ title: 'Gespeichert', description: 'Mitarbeitervertrag wurde aktualisiert.' })
    } catch {
      toast({ title: 'Fehler', description: 'Vertrag konnte nicht gespeichert werden.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPdf = () => {
    setPdfLoading(true)
    window.open('/api/admin/employee-contract/pdf', '_blank')
    setTimeout(() => setPdfLoading(false), 2000)
  }

  const handlePrintPreview = () => {
    window.open('/admin/settings/employee-contract/preview', '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-7 h-7 text-luxe-gold" />
          Mitarbeitervertrag
        </h1>
        <p className="text-luxe-silver mt-1">
          Vorlage im System hinterlegen, anpassen und als PDF ausdrucken oder herunterladen.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Vertragstext bearbeiten</CardTitle>
          <p className="text-sm text-luxe-silver font-normal">
            Nutze die Platzhalter in geschweiften Klammern; sie werden beim PDF-Download und in der Vorschau durch deine Firmendaten bzw. optionale Angaben ersetzt.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-luxe-black border border-luxe-gray p-3 flex items-start gap-2">
            <Info className="w-5 h-5 text-luxe-silver flex-shrink-0 mt-0.5" />
            <p className="text-sm text-luxe-silver leading-relaxed">
              {PLACEHOLDER_HINT}
            </p>
          </div>
          <div>
            <Label htmlFor="contract-template" className="text-luxe-silver sr-only">
              Vertragstext
            </Label>
            <Textarea
              id="contract-template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="min-h-[320px] font-mono text-sm bg-luxe-black border-luxe-gray text-white placeholder:text-luxe-silver/50"
              placeholder="Vertragstext mit Platzhaltern..."
              spellCheck={false}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="luxe"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Speichern
            </Button>
            <Button
              variant="outline"
              className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10"
              onClick={handlePrintPreview}
            >
              <Printer className="w-4 h-4 mr-2" />
              Vorschau & Drucken
            </Button>
            <Button
              variant="outline"
              className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10"
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
            >
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
              Als PDF herunterladen
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-luxe-silver/80">
        Hinweis: Dies ist eine technische Vorlage. Bitte lasse den Vertragstext von einem Rechtsanwalt oder Steuerberater prüfen und an dein Unternehmen anpassen.
      </p>
    </div>
  )
}
