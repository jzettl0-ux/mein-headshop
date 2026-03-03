'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Store, Send, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Recaptcha, resetRecaptcha } from '@/components/recaptcha'

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

const PARTNER_TYPES = [
  { value: 'company', label: 'Firma / Händler', desc: 'Gewerbetreibender mit Produkten' },
  { value: 'influencer', label: 'Influencer / Content Creator', desc: 'Eigene Produktlinie oder Kooperationen' },
] as const

const INFLUENCER_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/deinname' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@deinname' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@deinname' },
  { key: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/deinname' },
  { key: 'twitch', label: 'Twitch', placeholder: 'https://twitch.tv/deinname' },
  { key: 'andere', label: 'Sonstige (z. B. eigene Website, TikTok)', placeholder: 'https://...' },
] as const

const LEGAL_FORMS = [
  { value: '', label: 'Bitte wählen' },
  { value: 'GbR', label: 'GbR' },
  { value: 'GmbH', label: 'GmbH' },
  { value: 'UG', label: 'UG (haftungsbeschränkt)' },
  { value: 'AG', label: 'AG' },
  { value: 'Einzelunternehmen', label: 'Einzelunternehmen' },
  { value: 'OHG', label: 'OHG' },
  { value: 'KG', label: 'KG' },
  { value: 'Sonstige', label: 'Sonstige' },
]

export default function PartnerAnfragePage() {
  const [partnerType, setPartnerType] = useState<'influencer' | 'company'>('company')
  const [companyName, setCompanyName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [legalForm, setLegalForm] = useState('')
  const [vatId, setVatId] = useState('')
  const [addressStreet, setAddressStreet] = useState('')
  const [addressZip, setAddressZip] = useState('')
  const [addressCity, setAddressCity] = useState('')
  const [message, setMessage] = useState('')
  const [productInterest, setProductInterest] = useState('')
  const [influencerLinks, setInfluencerLinks] = useState<Record<string, string>>({})
  const [bfsgMicroEnterprise, setBfsgMicroEnterprise] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const captchaRequired = !!RECAPTCHA_SITE_KEY

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim() || !contactEmail.trim()) {
      toast({ title: 'Firmenname und E-Mail sind erforderlich.', variant: 'destructive' })
      return
    }
    if (captchaRequired && !captchaToken) {
      toast({ title: 'Bitte bestätige, dass du kein Roboter bist.', variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/vendor-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_type: partnerType,
          company_name: companyName.trim(),
          contact_email: contactEmail.trim(),
          contact_person: contactPerson.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
          legal_form: legalForm || undefined,
          vat_id: vatId.trim() || undefined,
          address_street: addressStreet.trim() || undefined,
          address_zip: addressZip.trim() || undefined,
          address_city: addressCity.trim() || undefined,
          message: message.trim() || undefined,
          product_interest: productInterest.trim() || undefined,
          influencer_links: partnerType === 'influencer' ? influencerLinks : undefined,
          bfsg_micro_enterprise_exemption: partnerType === 'company' ? bfsgMicroEnterprise : undefined,
          website_url: websiteUrl,
          captcha_token: captchaToken || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Anfrage konnte nicht gesendet werden.', variant: 'destructive' })
        return
      }
      toast({ title: 'Anfrage gesendet', description: 'Wir melden uns zeitnah bei dir.' })
      setCompanyName('')
      setContactEmail('')
      setContactPerson('')
      setContactPhone('')
      setLegalForm('')
      setVatId('')
      setAddressStreet('')
      setAddressZip('')
      setAddressCity('')
      setMessage('')
      setProductInterest('')
      setInfluencerLinks({})
      setBfsgMicroEnterprise(false)
      setPartnerType('company')
      setCaptchaToken('')
      if (recaptchaWidgetId != null) resetRecaptcha(recaptchaWidgetId)
    } catch {
      toast({ title: 'Fehler', description: 'Verbindungsproblem. Bitte später erneut versuchen.', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-xl">
        <Link href="/partner" className="inline-flex items-center text-luxe-silver hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zu Partner werden
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-luxe-gold/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-luxe-gold" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Partner-Anfrage</h1>
            <p className="text-luxe-silver">Wir prüfen deine Unterlagen und melden uns bei dir.</p>
          </div>
        </div>
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="hidden">
                <Label htmlFor="website_url">Nicht ausfüllen</Label>
                <Input id="website_url" type="text" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} tabIndex={-1} autoComplete="off" />
              </div>
              <div>
                <Label className="text-white block mb-2">Als was möchtest du dich registrieren? *</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {PARTNER_TYPES.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-colors ${
                        partnerType === opt.value
                          ? 'border-luxe-gold bg-luxe-gold/10'
                          : 'border-luxe-gray hover:border-luxe-silver/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="partner_type"
                        value={opt.value}
                        checked={partnerType === opt.value}
                        onChange={() => setPartnerType(opt.value)}
                        className="sr-only"
                      />
                      <span className="font-medium text-white">{opt.label}</span>
                      <span className="text-sm text-luxe-silver mt-1">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="company_name" className="text-white">{partnerType === 'influencer' ? 'Name / Künstlername *' : 'Firmenname / Handelsname *'}</Label>
                <Input id="company_name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 bg-luxe-gray border-luxe-silver text-white" placeholder={partnerType === 'influencer' ? 'z. B. Dein Künstlername oder Markenname' : 'z. B. Meine GmbH'} required disabled={sending} />
              </div>
              {partnerType === 'influencer' && (
              <div className="space-y-3 p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray">
                <Label className="text-white block">Deine Influencer-Konten / Kanäle</Label>
                <p className="text-sm text-luxe-silver">Verlinke deine Profile – egal ob TikTok, Instagram, YouTube, X oder andere Plattformen. So können wir dich besser kennenlernen und die ersten Einstellungen vornehmen.</p>
                {INFLUENCER_PLATFORMS.map((p) => (
                  <div key={p.key}>
                    <Label htmlFor={`influencer_${p.key}`} className="text-white text-sm">{p.label}</Label>
                    <Input
                      id={`influencer_${p.key}`}
                      type="url"
                      value={influencerLinks[p.key] ?? ''}
                      onChange={(e) => setInfluencerLinks((prev) => ({ ...prev, [p.key]: e.target.value.trim() }))}
                      className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                      placeholder={p.placeholder}
                      disabled={sending}
                    />
                  </div>
                ))}
              </div>
            )}
              {partnerType === 'company' && (
              <div className="p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray space-y-2">
                <Label className="text-white block">BFSG Barrierefreiheit (§2 Nr.17)</Label>
                <p className="text-sm text-luxe-silver">Kleinstunternehmen (weniger als 10 Beschäftigte und weniger als 2 Mio € Jahresumsatz) sind von der Barrierefreiheitspflicht ausgenommen.</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bfsgMicroEnterprise}
                    onChange={(e) => setBfsgMicroEnterprise(e.target.checked)}
                    className="rounded border-luxe-gray"
                    disabled={sending}
                    aria-describedby="bfsg-hint"
                  />
                  <span className="text-white text-sm">Wir erfüllen die Kriterien eines Kleinstunternehmens</span>
                </label>
                <span id="bfsg-hint" className="text-xs text-luxe-silver">Optional – dient der Compliance-Dokumentation.</span>
              </div>
            )}
              <div>
                <Label htmlFor="legal_form" className="text-white">Rechtsform</Label>
                <select id="legal_form" value={legalForm} onChange={(e) => setLegalForm(e.target.value)} className="mt-1 w-full rounded-md border border-luxe-silver bg-luxe-gray px-3 py-2 text-white" disabled={sending}>
                  {LEGAL_FORMS.map((o) => (
                    <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="vat_id" className="text-white">USt-IdNr. (optional)</Label>
                <Input id="vat_id" value={vatId} onChange={(e) => setVatId(e.target.value)} className="mt-1 bg-luxe-gray border-luxe-silver text-white" placeholder="DE123456789" disabled={sending} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person" className="text-white">Ansprechpartner</Label>
                  <Input id="contact_person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="mt-1 bg-luxe-gray border-luxe-silver text-white" placeholder="Max Mustermann" disabled={sending} />
                </div>
                <div>
                  <Label htmlFor="contact_email" className="text-white">E-Mail *</Label>
                  <Input id="contact_email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="mt-1 bg-luxe-gray border-luxe-silver text-white" placeholder="kontakt@firma.de" required disabled={sending} />
                </div>
              </div>
              <div>
                <Label htmlFor="contact_phone" className="text-white">Telefon</Label>
                <Input id="contact_phone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="mt-1 bg-luxe-gray border-luxe-silver text-white" placeholder="+49 123 456789" disabled={sending} />
              </div>
              <div>
                <Label htmlFor="address_street" className="text-white">Straße und Hausnummer</Label>
                <Input id="address_street" value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} className="mt-1 bg-luxe-gray border-luxe-silver text-white" placeholder="Musterstraße 1" disabled={sending} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address_zip" className="text-white">PLZ</Label>
                  <Input id="address_zip" value={addressZip} onChange={(e) => setAddressZip(e.target.value)} className="mt-1 bg-luxe-gray border-luxe-silver text-white" placeholder="12345" disabled={sending} />
                </div>
                <div>
                  <Label htmlFor="address_city" className="text-white">Ort</Label>
                  <Input id="address_city" value={addressCity} onChange={(e) => setAddressCity(e.target.value)} className="mt-1 bg-luxe-gray border-luxe-silver text-white" placeholder="Berlin" disabled={sending} />
                </div>
              </div>
              <div>
                <Label htmlFor="product_interest" className="text-white">Was möchtest du verkaufen?</Label>
                <Input id="product_interest" value={productInterest} onChange={(e) => setProductInterest(e.target.value)} className="mt-1 bg-luxe-gray border-luxe-silver text-white" placeholder="z. B. Grinder, Bongs, Zubehör" disabled={sending} />
              </div>
              <div>
                <Label htmlFor="message" className="text-white">Nachricht / Anmerkungen</Label>
                <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="mt-1 w-full rounded-md border border-luxe-silver bg-luxe-gray px-3 py-2 text-white placeholder:text-luxe-silver/60" placeholder="Optional: weitere Infos zu deinem Angebot" disabled={sending} />
              </div>
              {captchaRequired && (
                <div>
                  <Label className="text-white block mb-2">Sicherheitsprüfung</Label>
                  <Recaptcha siteKey={RECAPTCHA_SITE_KEY} theme="dark" onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} onWidgetId={setRecaptchaWidgetId} />
                </div>
              )}
              <Button type="submit" variant="luxe" disabled={sending} className="w-full sm:w-auto">
                {sending ? 'Wird gesendet…' : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Anfrage absenden
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
