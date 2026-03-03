'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Check, Truck, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

const RETURN_CARRIERS = [
  { value: 'dhl', label: 'DHL' },
  { value: 'dpd', label: 'DPD' },
  { value: 'gls', label: 'GLS' },
  { value: 'hermes', label: 'Hermes' },
  { value: 'ups', label: 'UPS' },
]

export default function AdminSettingsShopPage() {
  const [returnPrices, setReturnPrices] = useState<Record<string, number>>({})
  const [returnPricesLoading, setReturnPricesLoading] = useState(true)
  const [returnPricesSaving, setReturnPricesSaving] = useState(false)
  const [unpaidCancelHours, setUnpaidCancelHours] = useState<number>(48)
  const [unpaidCancelHoursLoading, setUnpaidCancelHoursLoading] = useState(true)
  const [unpaidCancelHoursSaving, setUnpaidCancelHoursSaving] = useState(false)
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyAddressSaving, setCompanyAddressSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/settings/return-carrier-prices')
      .then((res) => (res.ok ? res.json() : { carriers: [] }))
      .then((data: { carriers?: { value: string; label: string; price_cents: number }[] }) => {
        const map: Record<string, number> = {}
        ;(data.carriers ?? []).forEach((c) => { map[c.value] = c.price_cents })
        setReturnPrices(map)
      })
      .catch(() => {})
      .finally(() => setReturnPricesLoading(false))

    fetch('/api/admin/settings/unpaid-cancel-hours')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: { unpaid_cancel_hours?: number }) => setUnpaidCancelHours(typeof data.unpaid_cancel_hours === 'number' ? data.unpaid_cancel_hours : 48))
      .catch(() => {})
      .finally(() => setUnpaidCancelHoursLoading(false))

    fetch('/api/admin/settings/company-address')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: { company_address?: string }) => setCompanyAddress(data.company_address ?? ''))
      .catch(() => {})
  }, [])

  const sortedCarriers = [...RETURN_CARRIERS].sort((a, b) => (returnPrices[a.value] ?? 0) - (returnPrices[b.value] ?? 0))

  const handleReturnPriceChange = (carrier: string, euroValue: string | number) => {
    const num = euroValue === '' ? 0 : typeof euroValue === 'number' ? euroValue : parseFloat(String(euroValue).replace(',', '.'))
    setReturnPrices((prev) => ({ ...prev, [carrier]: Number.isNaN(num) ? 0 : Math.round(num * 100) }))
  }

  const saveReturnPrices = async () => {
    setReturnPricesSaving(true)
    try {
      const res = await fetch('/api/admin/settings/return-carrier-prices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnPrices),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      toast({ title: 'Rücksende-Preise gespeichert' })
    } catch {
      toast({ title: 'Fehler', description: 'Rücksende-Preise konnten nicht gespeichert werden.', variant: 'destructive' })
    } finally {
      setReturnPricesSaving(false)
    }
  }

  const saveUnpaidCancelHours = async () => {
    setUnpaidCancelHoursSaving(true)
    try {
      const res = await fetch('/api/admin/settings/unpaid-cancel-hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unpaid_cancel_hours: unpaidCancelHours }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      toast({ title: 'Einstellung gespeichert' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setUnpaidCancelHoursSaving(false)
    }
  }

  const saveCompanyAddress = async () => {
    setCompanyAddressSaving(true)
    try {
      const res = await fetch('/api/admin/settings/company-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_address: companyAddress }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      toast({ title: 'Firmenadresse gespeichert' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setCompanyAddressSaving(false)
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/settings" className="inline-flex items-center gap-2 text-luxe-silver hover:text-luxe-gold text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Zurück zu Einstellungen
        </Link>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Truck className="w-8 h-8 text-luxe-gold" />
          Shop & Versand
        </h1>
        <p className="text-luxe-silver mt-1">
          Rücksendungen, unbezahlte Bestellungen und Firmenadresse für Lieferanten.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Truck className="w-5 h-5 text-luxe-gold" />
            Rücksende-Preise
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Beträge in € pro Versanddienstleister. Werden dem Kunden bei der Rücksendeanfrage angezeigt und von der Erstattung abgezogen.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {returnPricesLoading ? (
            <div className="flex items-center gap-2 text-luxe-silver"><Loader2 className="w-4 h-4 animate-spin" /> Lade Preise…</div>
          ) : (
            <>
              {sortedCarriers.map((c) => (
                <div key={c.value} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Label className="text-white sm:w-24">{c.label}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={999.99}
                      step={0.01}
                      value={returnPrices[c.value] != null ? returnPrices[c.value] / 100 : ''}
                      onChange={(e) => handleReturnPriceChange(c.value, e.target.value)}
                      className="bg-luxe-gray border-luxe-gray text-white w-24"
                      placeholder="0"
                    />
                    <span className="text-luxe-silver">€</span>
                  </div>
                </div>
              ))}
              <Button onClick={saveReturnPrices} disabled={returnPricesSaving} variant="luxe" size="sm">
                {returnPricesSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Rücksende-Preise speichern
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-luxe-gold" />
            Unbezahlte Bestellungen
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Nach wie vielen Stunden unbezahlte Bestellungen automatisch storniert werden. 0 = deaktiviert. Ein Cron-Job muss regelmäßig <code className="bg-luxe-gray px-1 rounded text-xs">/api/cron/auto-cancel-unpaid</code> aufrufen.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {unpaidCancelHoursLoading ? (
            <div className="flex items-center gap-2 text-luxe-silver"><Loader2 className="w-4 h-4 animate-spin" /> Lade…</div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-white">Stunden</Label>
              <input
                type="number"
                min={0}
                max={999}
                value={unpaidCancelHours}
                onChange={(e) => setUnpaidCancelHours(Math.min(999, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                className="w-20 px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
              />
              <Button onClick={saveUnpaidCancelHours} disabled={unpaidCancelHoursSaving} variant="luxe" size="sm">
                {unpaidCancelHoursSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Speichern
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-luxe-gold" />
            Firmenadresse (für Lieferanten)
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Wird in der Bestellvorlage unter Lieferanten verwendet.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            placeholder="Firmenname&#10;Straße Hausnummer&#10;PLZ Ort&#10;Land"
            rows={5}
            className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm placeholder:text-luxe-silver/70"
          />
          <Button onClick={saveCompanyAddress} disabled={companyAddressSaving} variant="luxe" size="sm">
            {companyAddressSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Firmenadresse speichern
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
