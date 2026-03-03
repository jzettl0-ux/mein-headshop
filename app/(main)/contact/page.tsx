'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Send, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Recaptcha, resetRecaptcha } from '@/components/recaptcha'

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

export default function ContactPage() {
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const sub = searchParams.get('subject')
    const order = searchParams.get('order_number')
    const msg = searchParams.get('message')
    if (sub) setSubject(sub)
    if (order) setOrderNumber(order)
    if (msg) setMessage(decodeURIComponent(msg))
  }, [searchParams])

  const captchaRequired = !!RECAPTCHA_SITE_KEY

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({ title: 'Bitte fülle alle Pflichtfelder aus.', variant: 'destructive' })
      return
    }
    if (captchaRequired && !captchaToken) {
      toast({ title: 'Bitte bestätige, dass du kein Roboter bist.', variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || 'Anfrage über Kontaktformular',
          message: message.trim(),
          order_number: orderNumber.trim() || undefined,
          website_url: websiteUrl,
          captcha_token: captchaToken || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const desc = [data.error, data.detail].filter(Boolean).join(' — ') || 'Anfrage konnte nicht gesendet werden.'
        toast({ title: 'Fehler', description: desc, variant: 'destructive' })
        return
      }
      toast({ title: 'Nachricht gesendet', description: 'Wir melden uns schnellstmöglich bei dir.' })
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
      setOrderNumber('')
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
        <Link href="/" className="inline-flex items-center text-luxe-silver hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-lg bg-luxe-gold/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-luxe-gold" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Kontakt</h1>
            <p className="text-luxe-silver">Frage zu Bestellung oder Produkt? Schreib uns.</p>
          </div>
        </div>
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="absolute -left-[9999px] w-1 h-1 overflow-hidden" aria-hidden="true">
                <label htmlFor="website_url">Nicht ausfüllen</label>
                <input id="website_url" name="website_url" type="text" tabIndex={-1} autoComplete="off" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="name" className="text-white">Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-luxe-gray border-luxe-gray text-white mt-1" placeholder="Dein Name" required disabled={sending} />
              </div>
              <div>
                <Label htmlFor="email" className="text-white">E-Mail *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-luxe-gray border-luxe-gray text-white mt-1" placeholder="deine@email.de" required disabled={sending} />
              </div>
              <div>
                <Label htmlFor="subject" className="text-white">Betreff</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-luxe-gray border-luxe-gray text-white mt-1" placeholder="z. B. Frage zu Bestellung" disabled={sending} />
              </div>
              <div>
                <Label htmlFor="order" className="text-white">Bestellnummer (optional)</Label>
                <Input id="order" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="bg-luxe-gray border-luxe-gray text-white mt-1" placeholder="z. B. 12345" disabled={sending} />
              </div>
              <div>
                <Label htmlFor="message" className="text-white">Nachricht *</Label>
                <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="w-full mt-1 px-3 py-2 bg-luxe-gray border border-luxe-gray rounded-md text-white placeholder:text-luxe-silver resize-y" placeholder="Deine Nachricht..." required disabled={sending} />
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
              <Button
                type="submit"
                variant="luxe"
                className="w-full"
                disabled={sending || (captchaRequired && !captchaToken)}
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Wird gesendet...' : 'Nachricht senden'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-luxe-silver text-sm text-center mt-6">
          Oder per E-Mail: <a href="mailto:kontakt@mein-headshop.de" className="text-luxe-gold hover:underline">kontakt@mein-headshop.de</a>
        </p>
      </div>
    </div>
  )
}
