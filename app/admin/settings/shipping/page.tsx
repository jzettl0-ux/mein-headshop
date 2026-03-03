'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Truck, Loader2, Check, RefreshCw, CreditCard, ExternalLink, Info, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { RETURN_SHIPPING_CARRIERS } from '@/lib/return-shipping-carriers'

type ReturnAddressForm = {
  name: string
  name2: string
  street: string
  house_number: string
  postal_code: string
  city: string
  country: string
  email: string
  phone: string
}

type CarrierLinkEntry = {
  portal?: string
  returns?: string
  tracking?: string
  qr_return_url?: string
  return_print_url?: string
  return_prefill_url?: string
  api_base_url?: string
}
type CarrierLinks = Record<string, CarrierLinkEntry>

type CarrierCredentialForm = {
  api_key: string
  api_secret: string
  username: string
  password: string
  customer_number: string
  sandbox: boolean
}

const CARRIER_LABELS: Record<string, string> = { dhl: 'DHL', dpd: 'DPD', gls: 'GLS', hermes: 'Hermes', ups: 'UPS' }
const CARRIER_IDS = ['dhl', 'dpd', 'gls', 'hermes', 'ups'] as const

/** Pro Carrier: Was der Anbieter bietet + wo welcher API-Wert hingehört */
const CARRIER_API_INFO: Record<string, { offers: string; fields: Record<string, { label: string; hint: string }> }> = {
  dhl: {
    offers: 'Hinversand-Labels (Bestellung → „DHL Label erstellen“) und QR-Retourenlabels (druckerlose Retoure) werden per API erzeugt. Alle Zugangsdaten kommen aus dem DHL Developer Portal und Ihrem DHL-Vertrag.',
    fields: {
      api_key: { label: 'API Key (Client ID)', hint: 'Im DHL Developer Portal: App anlegen → Credentials → Client ID hier eintragen.' },
      api_secret: { label: 'API Secret (Client Secret)', hint: 'Gleiche App im DHL Developer Portal → Client Secret (geheim halten).' },
      username: { label: 'GKP-Benutzername', hint: 'Ihr Geschäftskunden-Login (GKP) bei DHL – für die Parcel API erforderlich.' },
      password: { label: 'GKP-Passwort', hint: 'Passwort zum GKP-Login (Geschäftskunden-Portal DHL).' },
      customer_number: { label: 'Billing-Nummer (EKP, 14 Ziffern)', hint: 'EKP + Produkt + Teilnahme aus Ihrem DHL-Vertrag, genau 14 Zeichen. Wird für die Abrechnung der Labels genutzt.' },
      sandbox: { label: 'Sandbox', hint: 'Testumgebung aktivieren (z. B. user-valid / SandboxPasswort2023!). Für Live-Labels deaktivieren.' },
    },
  },
  gls: {
    offers: 'Hinversand-Labels per GLS ShipIT API (Bestellung → „GLS Label erstellen“). Sie brauchen einen GLS ShipIT-Zugang (Geschäftskunden). Tracking-Links werden aus der Konfiguration unten gebaut.',
    fields: {
      api_key: { label: 'API Key (optional)', hint: 'Falls GLS eine API-Key-Auth nutzt – sonst leer lassen.' },
      api_secret: { label: 'API Secret (optional)', hint: 'Falls erforderlich – sonst leer. Für ShipIT oft nur Benutzername/Passwort.' },
      username: { label: 'ShipIT-Benutzername', hint: 'Ihr Benutzername für GLS ShipIT (vom GLS-Vertrag / ShipIT-Registrierung).' },
      password: { label: 'ShipIT-Passwort', hint: 'Passwort zum ShipIT-Login.' },
      customer_number: { label: 'Kunden-/Contact-ID (Shipper)', hint: 'Ihre GLS-Kundennummer / ContactID als Absender. Vom GLS-Vertrag oder ShipIT-Profil.' },
      sandbox: { label: 'Sandbox / Test-URL', hint: 'Falls Sie eine Test-API-URL nutzen. API-Basis-URL können Sie unten unter „API-Basis-URL“ setzen.' },
    },
  },
  dpd: {
    offers: 'Labels werden derzeit nur im DPD-Portal erstellt (Link „Portal öffnen“). Eine REST-API für Labels bietet DHL Deutschland nur per SOAP an – hier reicht die Tracking-URL für Sendungsverfolgung. Credentials können Sie für spätere Integration hinterlegen.',
    fields: {
      api_key: { label: 'API Key', hint: 'Falls DPD später eine REST-API anbietet – optional.' },
      api_secret: { label: 'API Secret', hint: 'Optional für künftige API.' },
      username: { label: 'Benutzername', hint: 'Portal-Login oder API-User, falls vorhanden.' },
      password: { label: 'Passwort', hint: 'Passwort zum Portal/API.' },
      customer_number: { label: 'Kunden-/Vertragsnummer', hint: 'Ihre DPD-Vertragsnummer.' },
      sandbox: { label: 'Sandbox', hint: 'Testumgebung, falls angeboten.' },
    },
  },
  hermes: {
    offers: 'Labels werden im Hermes Geschäftskunden-Portal erstellt (Link „Portal öffnen“). Tracking-URL unten eintragen, damit Kunden ihre Sendung verfolgen können. API-Credentials für spätere Label-API können Sie optional eintragen.',
    fields: {
      api_key: { label: 'API Key', hint: 'Optional, falls Hermes API-Zugang bereitstellt.' },
      api_secret: { label: 'API Secret', hint: 'Optional.' },
      username: { label: 'Benutzername', hint: 'Portal- oder API-Login.' },
      password: { label: 'Passwort', hint: 'Passwort.' },
      customer_number: { label: 'Kunden-/Vertragsnummer', hint: 'Hermes-Vertragsnummer.' },
      sandbox: { label: 'Sandbox', hint: 'Optional.' },
    },
  },
  ups: {
    offers: 'Labels im UPS-Portal erstellen (Link „Portal öffnen“). Tracking-URL unten eintragen. UPS bietet eine Developer-API für Labels – Credentials hier hinterlegen, wenn wir die API anbinden.',
    fields: {
      api_key: { label: 'API Key / Client ID', hint: 'Aus dem UPS Developer Portal (developer.ups.com), falls API genutzt wird.' },
      api_secret: { label: 'API Secret / Client Secret', hint: 'Aus dem UPS Developer Portal.' },
      username: { label: 'Benutzername', hint: 'UPS-Konto oder API-User.' },
      password: { label: 'Passwort', hint: 'Passwort.' },
      customer_number: { label: 'Kunden-/Account-Nummer', hint: 'UPS-Account-Nummer.' },
      sandbox: { label: 'Sandbox', hint: 'UPS bietet Testumgebung (z. B. onlinetools.ups.com vs. Sandbox-URL).' },
    },
  },
}

const emptyCredential = (): CarrierCredentialForm => ({
  api_key: '', api_secret: '', username: '', password: '', customer_number: '', sandbox: false,
})

export default function AdminSettingsShippingPage() {
  const [connectionsStatus, setConnectionsStatus] = useState<{
    mollie?: { configured: boolean; webhookUrlSet: boolean }
    dhl?: { configured: boolean; hasApiKey: boolean; hasApiSecret: boolean; hasGkp: boolean; hasBillingNumber: boolean; sandbox: boolean }
  } | null>(null)
  const [dhlTesting, setDhlTesting] = useState(false)
  const [dhlTestResult, setDhlTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [returnPrices, setReturnPrices] = useState<Record<string, number>>({})
  const [returnPricesLoading, setReturnPricesLoading] = useState(true)
  const [returnPricesSaving, setReturnPricesSaving] = useState(false)
  const [returnAddress, setReturnAddress] = useState<ReturnAddressForm>({
    name: '', name2: '', street: '', house_number: '', postal_code: '', city: '', country: '', email: '', phone: '',
  })
  const [returnAddressSaving, setReturnAddressSaving] = useState(false)
  const [carrierLinks, setCarrierLinks] = useState<CarrierLinks>({})
  const [carrierLinksLoading, setCarrierLinksLoading] = useState(true)
  const [carrierLinksSaving, setCarrierLinksSaving] = useState(false)
  const [carrierCredentials, setCarrierCredentials] = useState<Record<string, CarrierCredentialForm>>({
    dhl: emptyCredential(), dpd: emptyCredential(), gls: emptyCredential(), hermes: emptyCredential(), ups: emptyCredential(),
  })
  const [carrierCredsLoading, setCarrierCredsLoading] = useState(true)
  const [carrierCredsSaving, setCarrierCredsSaving] = useState(false)
  const [carrierTestStatus, setCarrierTestStatus] = useState<Record<string, { ok: boolean; message: string } | null>>({})
  const [carrierTestLoading, setCarrierTestLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const testCarrierConnection = async (carrier: string) => {
    setCarrierTestLoading(carrier)
    setCarrierTestStatus((s) => ({ ...s, [carrier]: null }))
    try {
      const res = await fetch(`/api/admin/carriers/test-connection?carrier=${carrier}`)
      const data = await res.json()
      setCarrierTestStatus((s) => ({ ...s, [carrier]: { ok: data.ok, message: data.message ?? '' } }))
      if (data.ok) toast({ title: `${carrier.toUpperCase()}`, description: data.message })
      else toast({ title: `${carrier.toUpperCase()}`, description: data.message, variant: 'destructive' })
    } catch {
      setCarrierTestStatus((s) => ({ ...s, [carrier]: { ok: false, message: 'Netzwerkfehler' } }))
      toast({ title: 'Fehler', description: 'Verbindungstest fehlgeschlagen', variant: 'destructive' })
    } finally {
      setCarrierTestLoading(null)
    }
  }

  useEffect(() => {
    fetch('/api/admin/settings/connections-status')
      .then((res) => (res.ok ? res.json() : {}))
      .then(setConnectionsStatus)
      .catch(() => setConnectionsStatus(null))

    fetch('/api/admin/settings/return-carrier-prices')
      .then((res) => (res.ok ? res.json() : { carriers: [] }))
      .then((data: { carriers?: { value: string; label: string; price_cents: number }[] }) => {
        const map: Record<string, number> = {}
        ;(data.carriers ?? []).forEach((c) => { map[c.value] = c.price_cents })
        setReturnPrices(map)
      })
      .catch(() => {})
      .finally(() => setReturnPricesLoading(false))

    fetch('/api/admin/settings/return-address')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: { return_address?: Partial<ReturnAddressForm> }) => {
        const ra = data.return_address ?? {}
        setReturnAddress({
          name: ra.name ?? '', name2: ra.name2 ?? '', street: ra.street ?? '', house_number: ra.house_number ?? '',
          postal_code: ra.postal_code ?? '', city: ra.city ?? '', country: ra.country ?? '', email: ra.email ?? '', phone: ra.phone ?? '',
        })
      })
      .catch(() => {})

    fetch('/api/admin/settings/carrier-links')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: { carrier_links?: CarrierLinks }) => setCarrierLinks(data.carrier_links ?? {}))
      .catch(() => {})
      .finally(() => setCarrierLinksLoading(false))

    fetch('/api/admin/settings/carrier-credentials')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: { carrier_credentials?: Record<string, Partial<CarrierCredentialForm> & { gkp_username?: string; gkp_password?: string; billing_number?: string }> }) => {
        const raw = data.carrier_credentials ?? {}
        const next: Record<string, CarrierCredentialForm> = {}
        for (const c of CARRIER_IDS) {
          const d = raw[c] ?? {}
          next[c] = {
            api_key: d.api_key ?? '',
            api_secret: d.api_secret ?? '',
            username: (d as any).gkp_username ?? d.username ?? '',
            password: (d as any).gkp_password ?? d.password ?? '',
            customer_number: (d as any).billing_number ?? d.customer_number ?? '',
            sandbox: d.sandbox ?? false,
          }
        }
        setCarrierCredentials(next)
      })
      .catch(() => {})
      .finally(() => setCarrierCredsLoading(false))
  }, [])

  const testDhlConnection = async () => {
    setDhlTesting(true)
    setDhlTestResult(null)
    try {
      const res = await fetch('/api/admin/dhl/test-connection')
      const data = await res.json()
      setDhlTestResult({ ok: data.ok, message: data.message })
      if (data.ok) toast({ title: 'DHL Verbindung OK', description: data.message })
      else toast({ title: 'DHL', description: data.message, variant: 'destructive' })
    } catch {
      setDhlTestResult({ ok: false, message: 'Netzwerkfehler' })
      toast({ title: 'Fehler', description: 'Verbindungstest fehlgeschlagen', variant: 'destructive' })
    } finally {
      setDhlTesting(false)
    }
  }

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

  const saveReturnAddress = async () => {
    setReturnAddressSaving(true)
    try {
      const res = await fetch('/api/admin/settings/return-address', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnAddress),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      toast({ title: 'Rücksendeadresse gespeichert' })
    } catch {
      toast({ title: 'Fehler', description: 'Rücksendeadresse konnte nicht gespeichert werden.', variant: 'destructive' })
    } finally {
      setReturnAddressSaving(false)
    }
  }

  const saveCarrierLinks = async () => {
    setCarrierLinksSaving(true)
    try {
      const res = await fetch('/api/admin/settings/carrier-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier_links: carrierLinks }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      toast({ title: 'Carrier-Links gespeichert' })
    } catch {
      toast({ title: 'Fehler', description: 'Carrier-Links konnten nicht gespeichert werden.', variant: 'destructive' })
    } finally {
      setCarrierLinksSaving(false)
    }
  }

  const updateCarrierLink = (carrier: string, field: keyof CarrierLinkEntry, value: string) => {
    setCarrierLinks((prev) => ({
      ...prev,
      [carrier]: { ...(prev[carrier] ?? {}), [field]: value },
    }))
  }

  const updateCarrierCredential = (carrier: string, field: keyof CarrierCredentialForm, value: string | boolean) => {
    setCarrierCredentials((prev) => ({
      ...prev,
      [carrier]: { ...(prev[carrier] ?? emptyCredential()), [field]: value },
    }))
  }

  const saveCarrierCredentials = async () => {
    setCarrierCredsSaving(true)
    try {
      const body: Record<string, unknown> = {}
      for (const c of CARRIER_IDS) {
        const cred = carrierCredentials[c] ?? emptyCredential()
        body[c] = c === 'dhl'
          ? { ...cred, gkp_username: cred.username, gkp_password: cred.password, billing_number: cred.customer_number }
          : cred
      }
      const res = await fetch('/api/admin/settings/carrier-credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier_credentials: body }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      toast({ title: 'Carrier-Verbindungsdaten gespeichert' })
    } catch {
      toast({ title: 'Fehler', description: 'Credential-Daten konnten nicht gespeichert werden.', variant: 'destructive' })
    } finally {
      setCarrierCredsSaving(false)
    }
  }

  const sortedCarriers = [...RETURN_SHIPPING_CARRIERS].sort((a, b) => (returnPrices[a.value] ?? 0) - (returnPrices[b.value] ?? 0))

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/settings" className="inline-flex items-center gap-2 text-luxe-silver hover:text-luxe-gold text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Zurück zu Einstellungen
        </Link>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Truck className="w-8 h-8 text-luxe-gold" />
          Versand & Logistik
        </h1>
        <p className="text-luxe-silver mt-1">
          Alle API-Einstellungen für Versanddienstleister (DHL, GLS, DPD, Hermes, UPS) werden hier im Dashboard vorgenommen – kein Bearbeiten von .env nötig. Pro Anbieter ist erklärt, was er bietet und welcher API-Code in welches Feld gehört. Rücksendeadresse, Carrier-Links (Tracking, Portal) und Zugangsdaten an einem Ort.
        </p>
      </div>

      {/* DHL Parcel DE */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Truck className="w-5 h-5 text-luxe-gold" />
              DHL Parcel DE
            </CardTitle>
            <p className="text-sm text-luxe-silver mt-1">
              Hinversand-Labels & QR-Retourenlabels per API. Alle Zugangsdaten tragen Sie unten bei <strong className="text-luxe-gold">Carrier-Portale, Links & API-Zugänge</strong> unter DHL ein (kein .env nötig).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testDhlConnection}
            disabled={dhlTesting}
            className="flex items-center gap-2 border-luxe-gold/50 text-luxe-gold hover:bg-luxe-gold/10 shrink-0"
          >
            {dhlTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Verbindung testen
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {dhlTestResult && (
            <div className={`p-4 rounded-lg border ${dhlTestResult.ok ? 'bg-green-500/10 border-green-500/50' : 'bg-amber-500/10 border-amber-500/50'}`}>
              <p className={dhlTestResult.ok ? 'text-green-400 font-medium' : 'text-amber-400 font-medium'}>{dhlTestResult.message}</p>
            </div>
          )}
          {connectionsStatus?.dhl && (
            <div className="flex flex-wrap gap-4 text-sm text-luxe-silver">
              <span>API-Key: {connectionsStatus.dhl.hasApiKey ? '✓' : '✗'}</span>
              <span>Secret: {connectionsStatus.dhl.hasApiSecret ? '✓' : '✗'}</span>
              <span>GKP: {connectionsStatus.dhl.hasGkp ? '✓' : '✗'}</span>
              <span>Billing-Nr.: {connectionsStatus.dhl.hasBillingNumber ? '✓' : '✗'}</span>
              <span>{connectionsStatus.dhl.sandbox ? 'Sandbox' : 'Produktion'}</span>
            </div>
          )}
          <p className="text-xs text-luxe-silver/80 flex items-center gap-1">
            <Info className="w-4 h-4 shrink-0" />
            DHL API Key, Secret, GKP-Benutzername, GKP-Passwort und 14-stellige Billing-Nummer unten bei <span className="text-luxe-gold">Carrier-Portale, Links & API-Zugänge</span> → DHL eintragen. Dort steht auch, welcher Wert wohin gehört.
          </p>
        </CardContent>
      </Card>

      {/* Rücksendeadresse – wohin Retouren gehen / Absender bei Labels */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-luxe-gold" />
            Rücksendeadresse
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Adresse, an die Retouren gesendet werden – wird für DHL-Labels (Shipper/Absender), QR-Retouren und sonstige Versanddokumente genutzt. Wenn leer, werden INVOICE_* bzw. DHL_SHIPPER_* aus .env verwendet.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-luxe-silver mb-1">Firmenname *</label>
              <Input value={returnAddress.name} onChange={(e) => setReturnAddress((r) => ({ ...r, name: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white" placeholder="Firmenname" />
            </div>
            <div>
              <label className="block text-xs text-luxe-silver mb-1">Zusatz (optional)</label>
              <Input value={returnAddress.name2} onChange={(e) => setReturnAddress((r) => ({ ...r, name2: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white" placeholder="z.B. Abteilung" />
            </div>
            <div>
              <label className="block text-xs text-luxe-silver mb-1">Straße *</label>
              <Input value={returnAddress.street} onChange={(e) => setReturnAddress((r) => ({ ...r, street: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white" placeholder="Straßenname" />
            </div>
            <div>
              <label className="block text-xs text-luxe-silver mb-1">Hausnummer *</label>
              <Input value={returnAddress.house_number} onChange={(e) => setReturnAddress((r) => ({ ...r, house_number: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white" placeholder="42" />
            </div>
            <div>
              <label className="block text-xs text-luxe-silver mb-1">PLZ *</label>
              <Input value={returnAddress.postal_code} onChange={(e) => setReturnAddress((r) => ({ ...r, postal_code: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white" placeholder="12345" />
            </div>
            <div>
              <label className="block text-xs text-luxe-silver mb-1">Ort *</label>
              <Input value={returnAddress.city} onChange={(e) => setReturnAddress((r) => ({ ...r, city: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white" placeholder="Berlin" />
            </div>
            <div>
              <label className="block text-xs text-luxe-silver mb-1">Land</label>
              <Input value={returnAddress.country} onChange={(e) => setReturnAddress((r) => ({ ...r, country: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white" placeholder="Deutschland oder DEU" />
            </div>
            <div>
              <label className="block text-xs text-luxe-silver mb-1">E-Mail (optional)</label>
              <Input type="email" value={returnAddress.email} onChange={(e) => setReturnAddress((r) => ({ ...r, email: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white" placeholder="support@example.de" />
            </div>
            <div>
              <label className="block text-xs text-luxe-silver mb-1">Telefon (optional)</label>
              <Input value={returnAddress.phone} onChange={(e) => setReturnAddress((r) => ({ ...r, phone: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white" placeholder="+49 30 12345678" />
            </div>
          </div>
          <Button onClick={saveReturnAddress} disabled={returnAddressSaving} variant="luxe" size="sm">
            {returnAddressSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            {returnAddressSaving ? 'Speichern…' : 'Rücksendeadresse speichern'}
          </Button>
        </CardContent>
      </Card>

      {/* Carrier-Portale, Links & API-Credentials – alles im Dashboard */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <ExternalLink className="w-5 h-5 text-luxe-gold" />
            Carrier-Portale, Links & API-Zugänge
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Alle API-Einstellungen für DHL, GLS, DPD, Hermes und UPS werden hier vorgenommen – keine .env nötig. Pro Anbieter: Was er bietet, welche Links (Tracking, Portal, Retouren) und welche Zugangsdaten wohin gehören. Platzhalter für URLs: {'{tracking}'}, {'{order_number}'}, {'{name}'}, {'{street}'}, {'{postal_code}'}, {'{city}'}.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {carrierLinksLoading ? (
            <div className="flex items-center gap-2 text-luxe-silver"><Loader2 className="w-4 h-4 animate-spin" /> Lade Carrier-Links…</div>
          ) : (
            <>
              {['dhl', 'dpd', 'gls', 'hermes', 'ups'].map((carrier) => {
                const cfg = carrierLinks[carrier] ?? {}
                const info = CARRIER_API_INFO[carrier]
                return (
                  <div key={carrier} className="border border-luxe-gray rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        {CARRIER_LABELS[carrier] ?? carrier.toUpperCase()}
                        {cfg.portal && (
                          <a href={cfg.portal} target="_blank" rel="noopener noreferrer" className="text-luxe-gold hover:underline text-sm font-normal">
                            Portal öffnen →
                          </a>
                        )}
                        {cfg.returns && (
                          <a href={cfg.returns} target="_blank" rel="noopener noreferrer" className="text-luxe-gold hover:underline text-sm font-normal">
                            Retouren →
                          </a>
                        )}
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testCarrierConnection(carrier)}
                        disabled={carrierTestLoading === carrier}
                        className="border-luxe-gold/50 text-luxe-gold hover:bg-luxe-gold/10 text-xs"
                      >
                        {carrierTestLoading === carrier ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : carrierTestStatus[carrier]?.ok ? (
                          <Check className="w-3 h-3 mr-1 text-green-400" />
                        ) : null}
                        Verbindung testen
                      </Button>
                    </div>
                    {info?.offers && (
                      <div className="flex items-start gap-2 p-3 rounded-md bg-luxe-gold/10 border border-luxe-gold/30">
                        <Info className="w-4 h-4 text-luxe-gold shrink-0 mt-0.5" />
                        <p className="text-sm text-luxe-silver leading-snug">
                          <span className="text-white font-medium">Was dieser Anbieter bietet: </span>
                          {info.offers}
                        </p>
                      </div>
                    )}
                    {carrierTestStatus[carrier] && (
                      <p className={`text-xs ${carrierTestStatus[carrier]!.ok ? 'text-green-400' : 'text-amber-400'}`}>
                        {carrierTestStatus[carrier]!.message}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-luxe-silver mb-1">Portal-URL</label>
                        <Input value={cfg.portal ?? ''} onChange={(e) => updateCarrierLink(carrier, 'portal', e.target.value)} className="bg-luxe-gray border-luxe-silver text-white text-sm" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="block text-xs text-luxe-silver mb-1">Retouren-URL</label>
                        <Input value={cfg.returns ?? ''} onChange={(e) => updateCarrierLink(carrier, 'returns', e.target.value)} className="bg-luxe-gray border-luxe-silver text-white text-sm" placeholder="https://retoure..." />
                      </div>
                      <div>
                        <label className="block text-xs text-luxe-silver mb-1">Tracking-URL (Platzhalter: {'{tracking}'})</label>
                        <Input value={cfg.tracking ?? ''} onChange={(e) => updateCarrierLink(carrier, 'tracking', e.target.value)} className="bg-luxe-gray border-luxe-silver text-white text-sm" placeholder="https://...?piececode={tracking}" />
                      </div>
                      <div>
                        <label className="block text-xs text-luxe-silver mb-1">QR-Retouren-URL / Endpoint für QR-Code</label>
                        <Input value={cfg.qr_return_url ?? ''} onChange={(e) => updateCarrierLink(carrier, 'qr_return_url', e.target.value)} className="bg-luxe-gray border-luxe-silver text-white text-sm" placeholder="z.B. eigener API-Endpoint oder Carrier-URL" />
                      </div>
                      <div>
                        <label className="block text-xs text-luxe-silver mb-1">Druck-URL (Label mit Platzhaltern)</label>
                        <Input value={cfg.return_print_url ?? ''} onChange={(e) => updateCarrierLink(carrier, 'return_print_url', e.target.value)} className="bg-luxe-gray border-luxe-silver text-white text-sm" placeholder="URL für Druck-Label mit {tracking}, {name}…" />
                      </div>
                      <div>
                        <label className="block text-xs text-luxe-silver mb-1">Prefill-URL (Webformular vorausgefüllt)</label>
                        <Input value={cfg.return_prefill_url ?? ''} onChange={(e) => updateCarrierLink(carrier, 'return_prefill_url', e.target.value)} className="bg-luxe-gray border-luxe-silver text-white text-sm" placeholder="Carrier-Formular mit Kundendaten vorausgefüllt" />
                      </div>
                      <div>
                        <label className="block text-xs text-luxe-silver mb-1">API-Basis-URL (Override Sandbox/Prod)</label>
                        <Input value={cfg.api_base_url ?? ''} onChange={(e) => updateCarrierLink(carrier, 'api_base_url', e.target.value)} className="bg-luxe-gray border-luxe-silver text-white text-sm" placeholder="z.B. https://api-eu.dhl.com/parcel/de" />
                        <p className="text-xs text-luxe-silver/80 mt-1">DHL: api-eu.dhl.com/parcel/de (Prod) oder api-sandbox.dhl.com/parcel/de. GLS: z. B. https://shipit.gls-group.eu falls abweichend.</p>
                      </div>
                    </div>
                    {/* API-Credentials – pro Carrier erklärt, welcher Wert wohin */}
                    <div className="pt-4 mt-4 border-t border-luxe-gray">
                      <h5 className="text-white font-medium text-sm mb-1">API-Zugangsdaten – welcher Code wohin</h5>
                      <p className="text-xs text-luxe-silver mb-3">Alle Werte werden nur hier im Dashboard gespeichert (nicht in .env). Nach dem Ausfüllen „Carrier-Credentials speichern“ klicken.</p>
                      {carrierCredsLoading ? (
                        <div className="text-luxe-silver text-xs">Lade…</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-white mb-1">{info?.fields?.api_key?.label ?? 'API Key / Client ID'}</label>
                            <Input type="password" autoComplete="off" value={carrierCredentials[carrier]?.api_key ?? ''} onChange={(e) => updateCarrierCredential(carrier, 'api_key', e.target.value)} className="bg-luxe-gray border-luxe-silver text-white font-mono text-sm" placeholder="API Key" />
                            {info?.fields?.api_key?.hint && <p className="text-xs text-luxe-silver/80 mt-1">{info.fields.api_key.hint}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white mb-1">{info?.fields?.api_secret?.label ?? 'API Secret / Client Secret'}</label>
                            <Input type="password" autoComplete="off" value={carrierCredentials[carrier]?.api_secret ?? ''} onChange={(e) => updateCarrierCredential(carrier, 'api_secret', e.target.value)} className="bg-luxe-gray border-luxe-silver text-white font-mono text-sm" placeholder="Secret" />
                            {info?.fields?.api_secret?.hint && <p className="text-xs text-luxe-silver/80 mt-1">{info.fields.api_secret.hint}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white mb-1">{info?.fields?.username?.label ?? 'Benutzername'}</label>
                            <Input value={carrierCredentials[carrier]?.username ?? ''} onChange={(e) => updateCarrierCredential(carrier, 'username', e.target.value)} className="bg-luxe-gray border-luxe-silver text-white text-sm" placeholder="Username" />
                            {info?.fields?.username?.hint && <p className="text-xs text-luxe-silver/80 mt-1">{info.fields.username.hint}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white mb-1">{info?.fields?.password?.label ?? 'Passwort'}</label>
                            <Input type="password" autoComplete="off" value={carrierCredentials[carrier]?.password ?? ''} onChange={(e) => updateCarrierCredential(carrier, 'password', e.target.value)} className="bg-luxe-gray border-luxe-silver text-white text-sm" placeholder="••••••" />
                            {info?.fields?.password?.hint && <p className="text-xs text-luxe-silver/80 mt-1">{info.fields.password.hint}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white mb-1">{info?.fields?.customer_number?.label ?? 'Kunden-/Billing-Nummer'}</label>
                            <Input value={carrierCredentials[carrier]?.customer_number ?? ''} onChange={(e) => updateCarrierCredential(carrier, 'customer_number', e.target.value)} className="bg-luxe-gray border-luxe-silver text-white font-mono text-sm" placeholder="z. B. 14-stellig (DHL)" />
                            {info?.fields?.customer_number?.hint && <p className="text-xs text-luxe-silver/80 mt-1">{info.fields.customer_number.hint}</p>}
                          </div>
                          <div className="flex flex-col justify-end">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id={`${carrier}-sandbox`} checked={carrierCredentials[carrier]?.sandbox ?? false} onChange={(e) => updateCarrierCredential(carrier, 'sandbox', e.target.checked)} className="rounded border-luxe-gray" />
                              <label htmlFor={`${carrier}-sandbox`} className="text-sm text-white">Sandbox (Testumgebung)</label>
                            </div>
                            {info?.fields?.sandbox?.hint && <p className="text-xs text-luxe-silver/80 mt-1">{info.fields.sandbox.hint}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div className="flex flex-wrap gap-3">
                <Button onClick={saveCarrierLinks} disabled={carrierLinksSaving} variant="luxe" size="sm">
                  {carrierLinksSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  {carrierLinksSaving ? 'Speichern…' : 'Carrier-Links speichern'}
                </Button>
                <Button onClick={saveCarrierCredentials} disabled={carrierCredsSaving} variant="outline" size="sm" className="border-luxe-gold/50 text-luxe-gold hover:bg-luxe-gold/10">
                  {carrierCredsSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  {carrierCredsSaving ? 'Speichern…' : 'Carrier-Credentials speichern'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Mollie Zahlung */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-luxe-gold" />
            Mollie (Zahlung)
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Checkout, Webhooks, Erstattungen. API-Key in <code className="bg-luxe-gray px-1 rounded text-xs">.env.local</code>.
          </p>
        </CardHeader>
        <CardContent>
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${connectionsStatus?.mollie?.configured ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
            {connectionsStatus?.mollie?.configured ? <Check className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            <span className="font-medium">{connectionsStatus?.mollie?.configured ? 'Konfiguriert' : 'MOLLIE_API_KEY fehlt oder leer'}</span>
          </div>
          {connectionsStatus?.mollie?.configured && (
            <p className="text-xs text-luxe-silver mt-2">
              Webhook-URL: {connectionsStatus.mollie.webhookUrlSet ? 'gesetzt' : 'nicht gesetzt (evtl. Auto-Erkennung)'}
            </p>
          )}
          <p className="text-xs text-luxe-silver/80 mt-2">
            Erforderlich: MOLLIE_API_KEY, optional MOLLIE_WEBHOOK_URL, MOLLIE_WEBHOOK_SECRET
          </p>
        </CardContent>
      </Card>

      {/* Rücksende-Preise pro Carrier */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Truck className="w-5 h-5 text-luxe-gold" />
            Rücksende-Preise
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Beträge in € pro Versanddienstleister – werden dem Kunden bei der Rücksendeanfrage angezeigt und von der Erstattung abgezogen.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {returnPricesLoading ? (
            <div className="flex items-center gap-2 text-luxe-silver"><Loader2 className="w-4 h-4 animate-spin" /> Lade Preise…</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-luxe-gray">
                      <th className="text-left py-2 text-luxe-silver font-medium">Versanddienstleister</th>
                      <th className="text-left py-2 text-luxe-silver font-medium">QR-Code</th>
                      <th className="text-left py-2 text-luxe-silver font-medium">Preis (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCarriers.map((c) => (
                      <tr key={c.value} className="border-b border-luxe-gray/50">
                        <td className="py-3 text-white font-medium">{c.label}</td>
                        <td className="py-3 text-luxe-silver text-xs">{c.supports_qr ? '✓ Ja' : 'Nur gedruckt'}</td>
                        <td className="py-3">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={999.99}
                            step={0.01}
                            value={returnPrices[c.value] != null ? returnPrices[c.value] / 100 : ''}
                            onChange={(e) => handleReturnPriceChange(c.value, e.target.value)}
                            className="w-24 bg-luxe-gray border-luxe-silver text-white"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button onClick={saveReturnPrices} disabled={returnPricesSaving} variant="luxe" size="sm">
                {returnPricesSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                {returnPricesSaving ? 'Speichern…' : 'Preise speichern'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Weitere Einstellungen */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white text-base">Weitere Einstellungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/settings/shop" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxe-gray/50 hover:bg-luxe-gray text-luxe-silver hover:text-white text-sm border border-luxe-gray">
              <Truck className="w-4 h-4" />
              Shop & Versand (unbezahlt stornieren, Firmenadresse)
            </Link>
            <Link href="/admin/integrations" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxe-gray/50 hover:bg-luxe-gray text-luxe-silver hover:text-white text-sm border border-luxe-gray">
              <RefreshCw className="w-4 h-4" />
              Schnittstellen (Partner-APIs, Lieferanten)
            </Link>
            <Link href="/admin/settings/webhooks" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxe-gray/50 hover:bg-luxe-gray text-luxe-silver hover:text-white text-sm border border-luxe-gray">
              <ExternalLink className="w-4 h-4" />
              Webhook-Log
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
