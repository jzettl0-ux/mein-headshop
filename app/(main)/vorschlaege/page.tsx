'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lightbulb, Send, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Recaptcha, resetRecaptcha } from '@/components/recaptcha'

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

const SUGGESTION_TYPES = [
  { value: 'category', label: 'Neue Kategorie', desc: 'z.B. „Dabbing-Zubehör“ oder „Aschenbecher“' },
  { value: 'feature', label: 'Neue Funktion', desc: 'z.B. Wunschliste, Vergleichstool' },
  { value: 'improvement', label: 'Verbesserung', desc: 'Bestehende Abläufe optimieren' },
  { value: 'design', label: 'Design & Darstellung', desc: 'Optik, Navigation, Mobile' },
  { value: 'other', label: 'Sonstiges', desc: 'Andere Ideen' },
] as const

export default function VorschlaegePage() {
  const [suggestionType, setSuggestionType] = useState<string>('other')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()

  const captchaRequired = !!RECAPTCHA_SITE_KEY

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !name.trim()) {
      toast({ title: 'Bitte fülle alle Pflichtfelder aus.', variant: 'destructive' })
      return
    }
    if (captchaRequired && !captchaToken) {
      toast({ title: 'Bitte bestätige, dass du kein Roboter bist.', variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion_type: suggestionType,
          title: title.trim(),
          description: description.trim() || undefined,
          name: name.trim(),
          email: email.trim() || undefined,
          captcha_token: captchaToken || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Vorschlag konnte nicht gesendet werden.', variant: 'destructive' })
        return
      }
      setSent(true)
      setTitle('')
      setDescription('')
      setName('')
      setEmail('')
      setCaptchaToken('')
      if (recaptchaWidgetId != null) resetRecaptcha(recaptchaWidgetId)
      toast({ title: 'Vorschlag gesendet', description: 'Vielen Dank! Wir prüfen deine Idee.' })
    } catch {
      toast({ title: 'Fehler', description: 'Verbindungsproblem. Bitte später erneut versuchen.', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-luxe-black py-12">
        <div className="container-luxe max-w-xl">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-luxe-neon/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-luxe-neon" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Vielen Dank für deinen Vorschlag!</h1>
            <p className="text-luxe-silver mb-8 max-w-md mx-auto">
              Wir prüfen alle Eingaben und melden uns bei Bedarf. Gute Ideen setzen wir gerne um – z.B. neue Kategorien direkt im Shop.
            </p>
            <Link href="/">
              <Button variant="luxe">Zurück zum Shop</Button>
            </Link>
          </div>
        </div>
      </div>
    )
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
            <Lightbulb className="w-6 h-6 text-luxe-gold" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Verbesserungsvorschläge</h1>
            <p className="text-luxe-silver">Hilf uns, den Shop zu verbessern – z.B. neue Kategorien, Features oder Ideen.</p>
          </div>
        </div>
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label className="text-white block mb-3">Art des Vorschlags</Label>
                <div className="grid gap-2">
                  {SUGGESTION_TYPES.map((t) => (
                    <label
                      key={t.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        suggestionType === t.value ? 'border-luxe-gold bg-luxe-gold/10' : 'border-luxe-gray hover:border-luxe-silver'
                      }`}
                    >
                      <input type="radio" name="type" value={t.value} checked={suggestionType === t.value} onChange={() => setSuggestionType(t.value)} className="mt-1 text-luxe-gold" />
                      <div>
                        <span className="text-white font-medium">{t.label}</span>
                        <p className="text-luxe-silver text-sm mt-0.5">{t.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="title" className="text-white">Titel *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-luxe-gray border-luxe-gray text-white mt-1"
                  placeholder="z.B. Neue Kategorie: Dabbing-Zubehör"
                  maxLength={200}
                  required
                  disabled={sending}
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-white">Beschreibung</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full mt-1 px-3 py-2 bg-luxe-gray border border-luxe-gray rounded-md text-white placeholder:text-luxe-silver resize-y"
                  placeholder="Beschreibe deine Idee ausführlich..."
                  maxLength={3000}
                  disabled={sending}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-white">Dein Name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-luxe-gray border-luxe-gray text-white mt-1" placeholder="Name" required disabled={sending} />
                </div>
                <div>
                  <Label htmlFor="email" className="text-white">E-Mail *</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-luxe-gray border-luxe-gray text-white mt-1" placeholder="für Rückfragen" required disabled={sending} />
                </div>
              </div>
              {captchaRequired && (
                <div>
                  <Label className="text-white block mb-2">Sicherheitsprüfung</Label>
                  <Recaptcha siteKey={RECAPTCHA_SITE_KEY} theme="dark" onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} onWidgetId={setRecaptchaWidgetId} />
                </div>
              )}
              <Button type="submit" variant="luxe" className="w-full" disabled={sending || (captchaRequired && !captchaToken)}>
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Wird gesendet...' : 'Vorschlag absenden'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-luxe-silver text-sm text-center mt-6">
          Alle Vorschläge werden geprüft. Bei Umsetzung (z.B. neue Kategorie) wird diese im Shop sichtbar.
        </p>
      </div>
    </div>
  )
}
