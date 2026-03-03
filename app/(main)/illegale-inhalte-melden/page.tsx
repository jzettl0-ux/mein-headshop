'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, Send, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Recaptcha, resetRecaptcha } from '@/components/recaptcha'

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

const VIOLATION_OPTIONS = [
  { value: 'ILLEGAL_DRUG_CONTENT', label: 'Illegale Drogen / Verstöße gegen Betäubungsmittelrecht' },
  { value: 'YOUTH_PROTECTION', label: 'Jugendgefährdung / Verstöße gegen Jugendschutz' },
  { value: 'IP_INFRINGEMENT', label: 'Verletzung geistigen Eigentums (Marke, Urheberrecht)' },
  { value: 'OTHER', label: 'Sonstiger illegaler oder rechtswidriger Inhalt' },
] as const

export default function IllegaleInhalteMeldenPage() {
  const searchParams = useSearchParams()
  const productSlug = searchParams.get('product')
  const [targetRef, setTargetRef] = useState('')
  const [violationType, setViolationType] = useState<string>('OTHER')

  useEffect(() => {
    if (productSlug && typeof window !== 'undefined') {
      const url = `${window.location.origin}/shop/${productSlug}`
      setTargetRef(url)
    }
  }, [productSlug])
  const [description, setDescription] = useState('')
  const [reporterEmail, setReporterEmail] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const captchaRequired = !!RECAPTCHA_SITE_KEY

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reporterEmail.trim()) {
      toast({
        title: 'E-Mail-Adresse ist erforderlich.',
        variant: 'destructive',
      })
      return
    }
    if (!targetRef.trim() && !description.trim()) {
      toast({
        title: 'Bitte gib an, welcher Inhalt gemeldet wird (URL/Produktlink oder Beschreibung).',
        variant: 'destructive',
      })
      return
    }
    if (captchaRequired && !captchaToken) {
      toast({ title: 'Bitte bestätige, dass du kein Roboter bist.', variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/ddg/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_ref: targetRef.trim() || undefined,
          violation_type: violationType,
          report_description: description.trim() || undefined,
          reporter_email: reporterEmail.trim() || undefined,
          website_url: websiteUrl,
          captcha_token: captchaToken || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          title: 'Fehler',
          description: data.error || 'Meldung konnte nicht gesendet werden.',
          variant: 'destructive',
        })
        return
      }
      toast({
        title: 'Meldung gesendet',
        description: 'Wir prüfen den Inhalt zeitnah und nehmen bei Bedarf Maßnahmen.',
      })
      setTargetRef('')
      setViolationType('OTHER')
      setDescription('')
      setReporterEmail('')
      setCaptchaToken('')
      if (recaptchaWidgetId != null) resetRecaptcha(recaptchaWidgetId)
    } catch {
      toast({
        title: 'Fehler',
        description: 'Verbindungsproblem. Bitte später erneut versuchen.',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-xl">
        <Link href="/" className="inline-flex items-center text-luxe-silver hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Illegale Inhalte melden</h1>
            <p className="text-luxe-silver">
              Meldestelle gemäß Digitale-Dienste-Gesetz (DDG) §17 – Notice & Action
            </p>
          </div>
        </div>
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-luxe-silver">
              Nutze dieses Formular, um Inhalte zu melden, die gegen geltendes Recht verstoßen könnten. Wir prüfen jede Meldung zeitnah und ergreifen bei berechtigten Hinweisen die erforderlichen Maßnahmen.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="hidden">
                <Label htmlFor="website_url">Nicht ausfüllen</Label>
                <Input
                  id="website_url"
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="target_ref" className="text-white">
                  URL oder Produktlink <span className="text-luxe-silver">(wenn bekannt)</span>
                </Label>
                <Input
                  id="target_ref"
                  type="text"
                  value={targetRef}
                  onChange={(e) => setTargetRef(e.target.value)}
                  placeholder="z. B. https://shop.de/shop/produkt-slug"
                  className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                  disabled={sending}
                />
              </div>
              <div>
                <Label htmlFor="violation_type" className="text-white">Art des Verstoßes</Label>
                <select
                  id="violation_type"
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-luxe-silver bg-luxe-gray px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                  disabled={sending}
                >
                  {VIOLATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="description" className="text-white">
                  Beschreibung des Inhalts / Begründung <span className="text-amber-400">*</span>
                </Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Bitte beschreibe kurz, was gemeldet wird und warum es möglicherweise rechtswidrig ist."
                  className="mt-1 w-full rounded-md border border-luxe-silver bg-luxe-gray px-3 py-2 text-white placeholder:text-luxe-silver/60 focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                  disabled={sending}
                />
                <p className="text-xs text-luxe-silver mt-1">Mindestens URL oder Beschreibung erforderlich.</p>
              </div>
              <div>
                <Label htmlFor="reporter_email" className="text-white">
                  Deine E-Mail <span className="text-amber-400">*</span>
                </Label>
                <Input
                  id="reporter_email"
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="Pflicht – gegen Missbrauch"
                  className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                  disabled={sending}
                  required
                />
                <p className="text-xs text-luxe-silver mt-1">Erforderlich – reduziert Spam und ermöglicht Rückfragen.</p>
              </div>
              {captchaRequired && (
                <div>
                  <Label className="text-white block mb-2">Sicherheitsprüfung</Label>
                  <Recaptcha
                    siteKey={RECAPTCHA_SITE_KEY}
                    theme="dark"
                    onVerify={setCaptchaToken}
                    onExpire={() => setCaptchaToken('')}
                    onWidgetId={setRecaptchaWidgetId}
                  />
                </div>
              )}
              <Button type="submit" variant="luxe" disabled={sending} className="w-full sm:w-auto">
                {sending ? 'Wird gesendet…' : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Meldung absenden
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-6 text-xs text-luxe-silver">
          Informationen zu unserem Notice-&-Action-Verfahren und dem Transparenzbericht findest du auf unserer{' '}
          <Link href="/compliance" className="text-luxe-gold hover:underline">Compliance-Seite</Link>.
        </p>
      </div>
    </div>
  )
}
