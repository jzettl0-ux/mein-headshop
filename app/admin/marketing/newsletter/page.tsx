'use client'

import { useState, useEffect } from 'react'
import { Mail, Sparkles, Loader2, Send, Users, Eye, Monitor, Smartphone, Package, Edit3, SendHorizontal, Tag } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type PreviewMode = 'desktop' | 'mobile'

type ProductOption = { id: string; name: string; slug: string }

export default function AdminMarketingNewsletterPage() {
  const [subscriberCount, setSubscriberCount] = useState<number>(0)
  const [loadingCount, setLoadingCount] = useState(true)
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [editorialNotes, setEditorialNotes] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')
  const [eventModeWeihnachtlich, setEventModeWeihnachtlich] = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [newsletterDiscountCode, setNewsletterDiscountCode] = useState('')
  const [savingDiscount, setSavingDiscount] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/settings/newsletter-discount')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => setNewsletterDiscountCode((d as { newsletter_discount_code?: string })?.newsletter_discount_code ?? ''))
      .catch(() => {})
  }, [])

  const saveNewsletterDiscount = () => {
    setSavingDiscount(true)
    fetch('/api/admin/settings/newsletter-discount', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsletter_discount_code: newsletterDiscountCode.trim() }),
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then(() => toast({ title: 'Willkommens-Rabatt gespeichert' }))
      .catch(() => toast({ title: 'Fehler', variant: 'destructive' }))
      .finally(() => setSavingDiscount(false))
  }

  useEffect(() => {
    fetch('/api/marketing/newsletter')
      .then((r) => (r.ok ? r.json() : { subscriber_count: 0 }))
      .then((d) => setSubscriberCount(d.subscriber_count ?? 0))
      .catch(() => setSubscriberCount(0))
      .finally(() => setLoadingCount(false))
  }, [])

  useEffect(() => {
    fetch('/api/admin/products/list')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProductOptions(Array.isArray(data) ? data : []))
      .catch(() => setProductOptions([]))
      .finally(() => setLoadingProducts(false))
  }, [])

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleGenerate = () => {
    setGenerating(true)
    fetch('/api/marketing/newsletter/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        editorial_notes: editorialNotes.trim(),
        product_ids: selectedProductIds.length > 0 ? selectedProductIds : undefined,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          toast({ title: 'Generierung fehlgeschlagen', description: d.error, variant: 'destructive' })
          return
        }
        setBodyHtml(d.html ?? '')
        if (!subject.trim()) setSubject('Deine wöchentliche Dosis – ' + (process.env.NEXT_PUBLIC_SITE_NAME || 'Premium Headshop'))
        const meta = d.meta
        if (meta) {
          toast({
            title: 'Entwurf erstellt',
            description: `${meta.products_count ?? 0} Produkte einbezogen. Sie können den Text unten jederzeit manuell anpassen.`,
          })
        } else {
          toast({ title: 'Entwurf erstellt' })
        }
      })
      .catch(() => toast({ title: 'Fehler', description: 'KI konnte nicht erreicht werden.', variant: 'destructive' }))
      .finally(() => setGenerating(false))
  }

  const handleTestSend = () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast({ title: 'Betreff und Inhalt ausfüllen', variant: 'destructive' })
      return
    }
    setTestSending(true)
    fetch('/api/marketing/newsletter/test-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: subject.trim(),
        body_html: bodyHtml.trim(),
        event_mode: eventModeWeihnachtlich ? 'weihnachtlich' : undefined,
      }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, ...d })))
      .then(({ ok, message, error }) => {
        if (ok) {
          toast({ title: 'Test-E-Mail gesendet', description: message ?? 'An die hinterlegte Test-Adresse.' })
        } else {
          toast({ title: 'Test-Versand fehlgeschlagen', description: error ?? 'Bitte später erneut versuchen.', variant: 'destructive' })
        }
      })
      .catch(() => {
        toast({ title: 'Fehler', description: 'Resend hat nicht reagiert. API-Key prüfen.', variant: 'destructive' })
      })
      .finally(() => setTestSending(false))
  }

  const handleSend = () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast({ title: 'Betreff und Inhalt ausfüllen', variant: 'destructive' })
      return
    }
    if (subscriberCount === 0) {
      toast({ title: 'Keine Abonnenten', description: 'Zuerst Abonnenten eintragen.', variant: 'destructive' })
      return
    }
    if (!confirm(`Newsletter an ${subscriberCount} Abonnent(en) senden?`)) return
    setSending(true)
    fetch('/api/marketing/newsletter/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: subject.trim(),
        body_html: bodyHtml.trim(),
        event_mode: eventModeWeihnachtlich ? 'weihnachtlich' : undefined,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          toast({ title: 'Versand fehlgeschlagen', description: d.error, variant: 'destructive' })
          return
        }
        toast({
          title: 'Newsletter versendet',
          description: `${d.sent ?? 0} von ${d.recipient_count} E-Mails gesendet.${d.failed ? ` ${d.failed} fehlgeschlagen.` : ''}`,
        })
        setBodyHtml('')
        setSubject('')
      })
      .catch(() => toast({ title: 'Fehler', description: 'Versand fehlgeschlagen.', variant: 'destructive' }))
      .finally(() => setSending(false))
  }

  const previewContainerClass = previewMode === 'mobile'
    ? 'max-w-[375px] mx-auto min-h-[400px]'
    : 'max-w-[680px] mx-auto min-h-[400px]'

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mail className="w-7 h-7 text-luxe-gold" />
            AI-Excellence Newsletter
          </h1>
          <p className="text-luxe-silver mt-1">
            Redaktionelle Notizen + manuelle Produktauswahl → KI erstellt einen edlen Entwurf. Sie behalten die letzte Entscheidung.
          </p>
        </div>
        {!loadingCount && (
          <div className="flex items-center gap-2 rounded-lg border border-luxe-gray px-4 py-2 bg-luxe-charcoal">
            <Users className="w-5 h-5 text-luxe-gold" />
            <span className="text-white font-medium">{subscriberCount}</span>
            <span className="text-luxe-silver text-sm">aktive Abonnenten</span>
          </div>
        )}
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-luxe-gold" />
            Willkommens-Rabatt für Newsletter-Anmeldung
          </CardTitle>
          <CardDescription className="text-luxe-silver">
            Rabattcode, den neue Abonnenten nach der Anmeldung erhalten (z. B. WILLKOMMEN10 für 10 % Rabatt). Den Code zuvor unter Rabattcodes anlegen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={newsletterDiscountCode}
              onChange={(e) => setNewsletterDiscountCode(e.target.value.toUpperCase())}
              placeholder="z. B. WILLKOMMEN10"
              className="max-w-xs bg-luxe-gray border-luxe-silver text-white font-mono placeholder:text-luxe-silver"
            />
            <Button variant="luxe" size="sm" onClick={saveNewsletterDiscount} disabled={savingDiscount}>
              {savingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-luxe-gold" />
            Newsletter mit KI generieren
          </CardTitle>
          <CardDescription className="text-luxe-silver">
            Redaktionelle Notizen und manuell gewählte Produkte. Die KI erstellt ein hochwertiges HTML-Template (Clean Luxe, Serif, viel Weißraum). Keine Emojis, keine schreienden Sales-Texte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white">Redaktionelle Notizen</Label>
            <textarea
              value={editorialNotes}
              onChange={(e) => setEditorialNotes(e.target.value)}
              placeholder="z. B. Schreibe über die neue Lieferung handgeblasener Bongs und erwähne den 10% Rabattcode HERBST24. Für festlichen Ton: 'weihnachtlich' erwähnen."
              rows={4}
              className="mt-1 w-full rounded-md border border-luxe-silver bg-luxe-gray px-3 py-2 text-white placeholder:text-luxe-silver resize-y"
            />
          </div>

          <div>
            <Label className="text-white flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produkte für den Newsletter (manuell auswählen)
            </Label>
            <p className="text-luxe-silver text-xs mt-1 mb-2">
              Keine Auswahl = es werden automatisch Neuheiten & Angebote aus der Datenbank verwendet.
            </p>
            {loadingProducts ? (
              <p className="text-luxe-silver text-sm">Lade Produkte…</p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-md border border-luxe-gray bg-luxe-black/50 p-3 space-y-2">
                {productOptions.length === 0 ? (
                  <p className="text-luxe-silver text-sm">Keine Produkte gefunden.</p>
                ) : (
                  productOptions.map((p) => (
                    <label key={p.id} className="flex items-center gap-3 cursor-pointer py-1.5 hover:bg-luxe-gray/30 rounded px-2">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="w-4 h-4 text-luxe-gold rounded"
                      />
                      <span className="text-white text-sm truncate">{p.name}</span>
                      <span className="text-luxe-silver text-xs shrink-0">/ {p.slug}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || loadingProducts}
            variant="luxe"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {generating ? 'Wird generiert…' : 'Newsletter-Entwurf generieren'}
          </Button>
          <p className="text-luxe-silver text-xs">
            Voraussetzung: OPENAI_API_KEY in .env.local. Sie können den generierten Text unten jederzeit manuell anpassen.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-luxe-gold" />
              Entwurf bearbeiten & versenden
            </CardTitle>
            <CardDescription className="text-luxe-silver">
              Betreff und HTML-Inhalt sind rein manuelle Textfelder. Live-Vorschau: Sie sehen das Ergebnis sofort und können jede Formulierung anpassen.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-luxe-silver hover:text-white"
            onClick={() => setPreviewOpen((v) => !v)}
          >
            <Eye className="w-4 h-4 mr-1" />
            {previewOpen ? 'Vorschau ausblenden' : 'Live-Vorschau anzeigen'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-luxe-silver">Betreff</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="z. B. Deine wöchentliche Dosis – Neuheiten & Tipps"
              className="mt-1 bg-luxe-gray border-luxe-silver text-white placeholder:text-luxe-silver"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={eventModeWeihnachtlich}
              onChange={(e) => setEventModeWeihnachtlich(e.target.checked)}
              className="w-4 h-4 text-luxe-gold rounded"
            />
            <span className="text-luxe-silver text-sm">Saisonal: Weihnachtlich (dezente Gold-/Rot-Linie, festlicher Akzent im Design)</span>
          </label>
          <div>
            <Label className="text-luxe-silver">Inhalt (HTML) – manuell bearbeitbar</Label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="<h2>Überschrift</h2><p>Absatz…</p> Nach Generierung hier anpassen, falls gewünscht."
              rows={14}
              className="mt-1 w-full rounded-md border border-luxe-silver bg-luxe-gray px-3 py-2 text-white placeholder:text-luxe-silver font-mono text-sm resize-y"
            />
            <p className="text-xs text-luxe-silver mt-1">
              Sie behalten die letzte Entscheidung: Jede Formulierung kann hier geändert werden, bevor Sie versenden.
            </p>
          </div>

          {previewOpen && (
            <div className="rounded-lg border border-luxe-gray overflow-hidden bg-white">
              <div className="flex items-center justify-between px-3 py-2 border-b border-luxe-gray bg-stone-100">
                <span className="text-stone-600 text-xs font-medium">Live-Vorschau</span>
                <div className="flex rounded-md border border-stone-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('desktop')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${previewMode === 'desktop' ? 'bg-stone-700 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-l border-stone-300 ${previewMode === 'mobile' ? 'bg-stone-700 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Mobil
                  </button>
                </div>
              </div>
              <div className="p-4 bg-stone-200/80">
                <div
                  className={`${previewContainerClass} rounded-lg border border-stone-300 bg-white shadow-sm overflow-auto min-h-[320px]`}
                >
                  {bodyHtml.trim() ? (
                    <div
                      className="p-8 text-stone-800 prose prose-neutral max-w-none [&_h2]:font-serif [&_h2]:text-center [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-4 [&_p]:my-3 [&_a]:text-stone-700 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_table]:w-full [&_td]:p-2 [&_img]:max-w-full"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                  ) : (
                    <div className="p-8 text-stone-400 text-center text-sm" style={{ fontFamily: 'Georgia, serif' }}>
                      Vorschau erscheint nach Generierung oder manueller Eingabe.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestSend}
              disabled={testSending || sending || !bodyHtml.trim() || !subject.trim()}
              className="border-luxe-gray text-luxe-silver hover:bg-luxe-gray/50 hover:text-white"
            >
              {testSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <SendHorizontal className="w-4 h-4 mr-2" />}
              {testSending ? 'Wird gesendet…' : 'Test-E-Mail senden'}
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || testSending || !bodyHtml.trim() || !subject.trim() || subscriberCount === 0}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {sending ? 'Wird gesendet…' : `Newsletter an ${subscriberCount} Abonnenten senden`}
            </Button>
          </div>
          <p className="text-xs text-luxe-silver">
            Test-E-Mail geht an die in site_settings (key: newsletter_test_email) hinterlegte Adresse. Betreff wird mit „[TEST]“ versehen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
