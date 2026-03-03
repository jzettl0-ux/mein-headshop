'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Settings2, Loader2, Save, ArrowLeft, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type Overrides = {
  company_name: string
  company_address: string
  company_postal_code: string
  company_city: string
  company_country: string
  company_vat_id: string
  company_email: string
  company_phone: string
  company_represented_by: string
  support_hours: string
  site_url: string
  site_name: string
  resend_from_email: string
  delivery_estimate_days: string
}

const DEFAULT_OVERRIDES: Overrides = {
  company_name: '',
  company_address: '',
  company_postal_code: '',
  company_city: '',
  company_country: '',
  company_vat_id: '',
  company_email: '',
  company_phone: '',
  company_represented_by: '',
  support_hours: '',
  site_url: '',
  site_name: '',
  resend_from_email: '',
  delivery_estimate_days: '',
}

export default function AdminSettingsEnvPage() {
  const [form, setForm] = useState<Overrides>(DEFAULT_OVERRIDES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/settings/env-overrides')
      .then((res) => (res.ok ? res.json() : { overrides: DEFAULT_OVERRIDES }))
      .then((data) => {
        const o = data.overrides ?? {}
        setForm({
          company_name: o.company_name ?? '',
          company_address: o.company_address ?? '',
          company_postal_code: o.company_postal_code ?? '',
          company_city: o.company_city ?? '',
          company_country: o.company_country ?? '',
          company_vat_id: o.company_vat_id ?? '',
          company_email: o.company_email ?? '',
          company_phone: o.company_phone ?? '',
          company_represented_by: o.company_represented_by ?? '',
          support_hours: o.support_hours ?? '',
          site_url: o.site_url ?? '',
          site_name: o.site_name ?? '',
          resend_from_email: o.resend_from_email ?? '',
          delivery_estimate_days: o.delivery_estimate_days ?? '',
        })
      })
      .catch(() => toast({ title: 'Fehler', description: 'Einstellungen konnten nicht geladen werden.', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [toast])

  const handleChange = (key: keyof Overrides, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings/env-overrides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      toast({ title: 'Gespeichert', description: 'Umgebungswerte wurden aktualisiert. Sie gelten sofort (Admin hat Vorrang vor .env).' })
    } catch {
      toast({ title: 'Fehler', description: 'Einstellungen konnten nicht gespeichert werden.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="text-luxe-silver" asChild>
          <Link href="/admin/settings">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Zurück
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings2 className="w-7 h-7 text-luxe-gold" />
          Umgebung & .env-Werte
        </h1>
        <p className="text-luxe-silver mt-1">
          Alles, was Sie sonst in .env.local eintragen, können Sie hier im Dashboard anpassen. Gespeicherte Werte haben Vorrang vor der .env.
        </p>
      </div>

      <div className="rounded-lg bg-luxe-black border border-luxe-gray p-3 flex items-start gap-2">
        <Info className="w-5 h-5 text-luxe-silver flex-shrink-0 mt-0.5" />
        <p className="text-sm text-luxe-silver leading-relaxed">
          Leer lassen = Wert aus .env.local verwenden. Nur ausgefüllte Felder werden als Override gespeichert. API-Keys (z. B. MOLLIE_API_KEY, RESEND_API_KEY) bleiben aus Sicherheitsgründen in .env – hier nur sichtbare/öffentliche Angaben.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Unternehmen (Impressum, Rechnung, Footer)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-luxe-silver">Firmenname</Label>
              <Input value={form.company_name} onChange={(e) => handleChange('company_name', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="Aus ENV: INVOICE_COMPANY_NAME" />
            </div>
            <div>
              <Label className="text-luxe-silver">Vertreten durch</Label>
              <Input value={form.company_represented_by} onChange={(e) => handleChange('company_represented_by', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="z. B. Max Mustermann, Geschäftsführer" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-luxe-silver">Straße und Hausnummer</Label>
              <Input value={form.company_address} onChange={(e) => handleChange('company_address', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="INVOICE_COMPANY_ADDRESS" />
            </div>
            <div>
              <Label className="text-luxe-silver">PLZ</Label>
              <Input value={form.company_postal_code} onChange={(e) => handleChange('company_postal_code', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="INVOICE_POSTAL_CODE" />
            </div>
            <div>
              <Label className="text-luxe-silver">Ort</Label>
              <Input value={form.company_city} onChange={(e) => handleChange('company_city', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="INVOICE_CITY" />
            </div>
            <div>
              <Label className="text-luxe-silver">Land</Label>
              <Input value={form.company_country} onChange={(e) => handleChange('company_country', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="INVOICE_COUNTRY" />
            </div>
            <div>
              <Label className="text-luxe-silver">USt-ID</Label>
              <Input value={form.company_vat_id} onChange={(e) => handleChange('company_vat_id', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="INVOICE_VAT_ID" />
            </div>
            <div>
              <Label className="text-luxe-silver">E-Mail</Label>
              <Input type="email" value={form.company_email} onChange={(e) => handleChange('company_email', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="INVOICE_EMAIL" />
            </div>
            <div>
              <Label className="text-luxe-silver">Telefon</Label>
              <Input value={form.company_phone} onChange={(e) => handleChange('company_phone', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="INVOICE_PHONE" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Shop & Öffentlich</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-luxe-silver">Supportzeiten (Footer)</Label>
              <Input value={form.support_hours} onChange={(e) => handleChange('support_hours', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="z. B. Mo–Fr 10–18 Uhr" />
            </div>
            <div>
              <Label className="text-luxe-silver">Shop-URL</Label>
              <Input value={form.site_url} onChange={(e) => handleChange('site_url', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="NEXT_PUBLIC_SITE_URL" />
            </div>
            <div>
              <Label className="text-luxe-silver">Shop-Name</Label>
              <Input value={form.site_name} onChange={(e) => handleChange('site_name', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="NEXT_PUBLIC_SITE_NAME" />
            </div>
            <div>
              <Label className="text-luxe-silver">E-Mail Absender (Anzeige)</Label>
              <Input value={form.resend_from_email} onChange={(e) => handleChange('resend_from_email', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="Shop-Name &lt;support@domain.de&gt;" />
            </div>
            <div>
              <Label className="text-luxe-silver">Lieferzeiten-Anzeige (Checkout)</Label>
              <Input value={form.delivery_estimate_days} onChange={(e) => handleChange('delivery_estimate_days', e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" placeholder="z. B. 2–4 Werktage" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="luxe" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Speichern
      </Button>
    </div>
  )
}
