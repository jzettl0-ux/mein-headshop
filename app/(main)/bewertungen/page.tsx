'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Recaptcha, resetRecaptcha } from '@/components/recaptcha'
import { FALLBACK_SHOP_REVIEWS } from '@/lib/fallback-reviews'

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

function ReviewFormContent({
  form,
  setForm,
  captchaRequired,
  captchaToken,
  setCaptchaToken,
  recaptchaWidgetId,
  setRecaptchaWidgetId,
  submitting,
  RECAPTCHA_SITE_KEY: siteKey,
}: {
  form: { display_name: string; comment: string; rating: number; website_url: string }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  captchaRequired: boolean
  captchaToken: string
  setCaptchaToken: (t: string) => void
  recaptchaWidgetId: number | null
  setRecaptchaWidgetId: (id: number | null) => void
  submitting: boolean
  RECAPTCHA_SITE_KEY: string
}) {
  return (
    <>
      <div className="absolute -left-[9999px] opacity-0" aria-hidden>
        <Label htmlFor="website_url_h">Website</Label>
        <Input id="website_url_h" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))} />
      </div>
      <div>
        <Label htmlFor="display_name" className="text-white">Dein Name (wird angezeigt)</Label>
        <Input id="display_name" value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} placeholder="z. B. Max M." className="mt-2 bg-luxe-gray border-luxe-silver text-white" required />
      </div>
      <div>
        <Label className="text-white">Sterne</Label>
        <div className="flex gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, rating: s }))} className="p-1 focus:outline-none focus:ring-2 focus:ring-luxe-gold rounded">
              <Star className={`w-8 h-8 ${form.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-luxe-gray'}`} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="comment" className="text-white">Dein Kommentar (optional)</Label>
        <textarea id="comment" value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Wie war deine Erfahrung mit unserem Shop?" rows={4} className="w-full px-4 py-3 mt-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver/60 resize-none focus:outline-none focus:ring-2 focus:ring-luxe-gold" />
      </div>
      {captchaRequired && (
        <div className="flex justify-center md:justify-start">
          <Recaptcha siteKey={siteKey} theme="dark" onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} onWidgetId={setRecaptchaWidgetId} />
        </div>
      )}
      <Button type="submit" variant="luxe" className="w-full" disabled={submitting}>
        {submitting ? 'Wird gesendet...' : 'Bewertung absenden'}
      </Button>
      <p className="text-xs text-luxe-silver">
        Deine Bewertung wird nach Prüfung veröffentlicht. Wir behalten uns vor, unangemessene Einträge nicht anzuzeigen.
      </p>
    </>
  )
}
const REVIEWS_PER_PAGE = 9
const REVIEWS_SHOW_FORM_MAX = 12

interface ShopReview {
  id: string
  rating: number
  comment: string | null
  display_name: string
  source: 'customer' | 'google'
  created_at: string
}

export default function BewertungenPage() {
  const [reviews, setReviews] = useState<ShopReview[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ display_name: '', comment: '', rating: 5, website_url: '' })
  const [captchaToken, setCaptchaToken] = useState('')
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [formExpanded, setFormExpanded] = useState(true)
  const { toast } = useToast()

  const captchaRequired = !!RECAPTCHA_SITE_KEY
  const displayReviews: ShopReview[] = [...FALLBACK_SHOP_REVIEWS, ...reviews]
  const totalReviews = displayReviews.length
  const visibleReviews = showAllReviews ? displayReviews : displayReviews.slice(0, REVIEWS_PER_PAGE)
  const hasMoreReviews = totalReviews > REVIEWS_PER_PAGE
  const showForm = totalReviews < REVIEWS_SHOW_FORM_MAX
  const formCollapsible = totalReviews >= 6 && totalReviews < REVIEWS_SHOW_FORM_MAX

  useEffect(() => {
    fetch('/api/shop-reviews')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && displayReviews.length >= 6) setFormExpanded(false)
  }, [loading, displayReviews.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.display_name.trim()) {
      toast({ title: 'Bitte gib einen Anzeigenamen ein.', variant: 'destructive' })
      return
    }
    if (captchaRequired && !captchaToken) {
      toast({ title: 'Bitte bestätige, dass du kein Roboter bist.', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/shop-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: form.display_name.trim(),
          comment: form.comment.trim() || undefined,
          rating: form.rating,
          website_url: form.website_url || undefined,
          captcha_token: captchaToken || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      toast({ title: 'Danke!', description: 'Deine Bewertung wird nach Prüfung veröffentlicht.' })
      setForm({ display_name: '', comment: '', rating: 5, website_url: '' })
      setCaptchaToken('')
      if (recaptchaWidgetId != null) resetRecaptcha(recaptchaWidgetId)
    } catch (e) {
      toast({ title: 'Fehler', description: e instanceof Error ? e.message : 'Bitte versuche es erneut.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  const avgRating = displayReviews.length > 0 ? (displayReviews.reduce((a, r) => a + r.rating, 0) / displayReviews.length).toFixed(1) : null

  return (
    <div className="min-h-screen bg-luxe-black py-12 sm:py-16">
      <div className="container-luxe px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-gradient-flow">Kundenbewertungen</span>
          </h1>
          <p className="text-luxe-silver text-lg">
            Das sagen unsere Kunden und Nutzer über uns – ehrliche Meinungen zu Service, Qualität und Versand.
          </p>
          {avgRating && displayReviews.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-6 h-6 ${Number(avgRating) >= i ? 'text-amber-400 fill-amber-400' : 'text-luxe-gray'}`} />
                ))}
              </div>
              <span className="text-white font-semibold text-lg">{avgRating}</span>
              <span className="text-luxe-silver text-sm">({displayReviews.length} Bewertungen)</span>
            </div>
          )}
        </motion.div>

        {/* Bewertungen anzeigen (inkl. Beispiel-Kundenstimmen) */}
        {loading ? (
          <div className="text-center py-16 text-luxe-silver">Laden...</div>
        ) : displayReviews.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {visibleReviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative rounded-2xl border border-luxe-gray bg-luxe-charcoal/80 p-6 flex flex-col"
              >
                <Quote className="w-10 h-10 text-luxe-gold/30 absolute top-4 right-4" aria-hidden />
                <div className="flex gap-1 mb-4" aria-hidden>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${r.rating >= s ? 'text-luxe-gold fill-luxe-gold' : 'text-luxe-gray'}`} />
                  ))}
                </div>
                {r.comment ? (
                  <p className="text-luxe-silver text-sm leading-relaxed flex-1">„{r.comment}"</p>
                ) : (
                  <p className="text-luxe-silver/70 text-sm italic flex-1">(Kein Kommentar)</p>
                )}
                <footer className="mt-4 pt-4 border-t border-luxe-gray">
                  <p className="text-white font-semibold text-sm">{r.display_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-luxe-silver/80 text-xs">{formatDate(r.created_at)}</span>
                    {r.source === 'google' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Google</span>
                    )}
                  </div>
                </footer>
              </motion.div>
            ))}
            </div>
            {hasMoreReviews && (
              <div className="text-center mb-16">
                <Button
                  variant="outline"
                  className="gap-2 border-luxe-gray text-luxe-silver hover:bg-luxe-charcoal hover:text-white"
                  onClick={() => setShowAllReviews((v) => !v)}
                >
                  {showAllReviews ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Weniger anzeigen
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      {totalReviews - REVIEWS_PER_PAGE} weitere Bewertungen anzeigen
                    </>
                  )}
                </Button>
              </div>
            )}
            {!hasMoreReviews && <div className="mb-16" />}
          </>
        ) : (
          <div className="text-center py-16 text-luxe-silver mb-16">
            Noch keine Bewertungen. Sei der Erste und teile deine Erfahrung!
          </div>
        )}

        {/* Formular: Eigene Bewertung abgeben – ausgeblendet ab 12 Bewertungen */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto"
          >
            {formCollapsible ? (
              <div className="rounded-2xl border border-luxe-gray bg-luxe-charcoal/80 p-6">
                <button
                  type="button"
                  onClick={() => setFormExpanded((v) => !v)}
                  className="w-full flex items-center justify-between gap-4 text-left"
                >
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-luxe-gold" />
                    Bewertung abgeben
                  </h2>
                  {formExpanded ? (
                    <ChevronUp className="w-5 h-5 text-luxe-silver shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-luxe-silver shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {formExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={handleSubmit} className="relative space-y-4 pt-6">
                        <ReviewFormContent form={form} setForm={setForm} captchaRequired={captchaRequired} captchaToken={captchaToken} setCaptchaToken={setCaptchaToken} recaptchaWidgetId={recaptchaWidgetId} setRecaptchaWidgetId={setRecaptchaWidgetId} submitting={submitting} RECAPTCHA_SITE_KEY={RECAPTCHA_SITE_KEY} />
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-luxe-gold" />
                  Bewertung abgeben
                </h2>
                <form onSubmit={handleSubmit} className="relative space-y-4 rounded-2xl border border-luxe-gray bg-luxe-charcoal/80 p-6">
                  <ReviewFormContent form={form} setForm={setForm} captchaRequired={captchaRequired} captchaToken={captchaToken} setCaptchaToken={setCaptchaToken} recaptchaWidgetId={recaptchaWidgetId} setRecaptchaWidgetId={setRecaptchaWidgetId} submitting={submitting} RECAPTCHA_SITE_KEY={RECAPTCHA_SITE_KEY} />
                </form>
              </>
            )}
          </motion.div>
        )}
        {!showForm && totalReviews > 0 && (
          <p className="text-center text-luxe-silver text-sm py-8">
            Vielen Dank für die vielen Bewertungen. Wir freuen uns über das Vertrauen unserer Kunden.
          </p>
        )}
      </div>
    </div>
  )
}
