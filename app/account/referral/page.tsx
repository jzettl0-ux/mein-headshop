'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Copy, Check, Share2, Mail, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/supabase/auth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''

export default function AccountReferralPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [code, setCode] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let mounted = true
    getCurrentUser().then((user) => {
      if (!user && mounted) {
        router.replace('/auth?redirect=/account/referral')
        return
      }
      if (!user) return
      fetch('/api/account/referral')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (mounted && d) {
            setCode(d.code ?? null)
            setLink(d.link ?? (d.code ? `${BASE_URL || ''}/auth?ref=${encodeURIComponent(d.code)}` : null))
          }
        })
        .finally(() => {
          if (mounted) setLoading(false)
        })
    })
    return () => { mounted = false }
  }, [router])

  const handleCopy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast({ title: 'Link kopiert', description: 'Der Empfehlungslink wurde in die Zwischenablage kopiert.' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Kopieren fehlgeschlagen', variant: 'destructive' })
    }
  }

  const shareUrl = link ?? ''
  const whatsappText = `Schau mal vorbei – mit meinem Link bekommst du 10€ Rabatt auf deine erste Bestellung (Mindestbestellwert 50€): ${shareUrl}`
  const mailSubject = '10€ Rabatt für dich'
  const mailBody = `Hallo,\n\nmit meinem Link bekommst du 10€ Rabatt auf deine erste Bestellung (Mindestbestellwert 50€). Ich erhalte dafür eine Belohnung.\n\n${shareUrl}`

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse rounded-xl bg-muted h-48" />
        <div className="mt-6 animate-pulse rounded-xl bg-muted h-32" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <Link
        href="/account"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zum Konto
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-10"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Teile den Vibe – Erhalte 10€ für jeden geworbenen Freund.
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Sende deinen persönlichen Link an Freunde. Sobald sie mindestens 50€ bestellen und bezahlen,
          erhältst du <strong>200 Treuepunkte</strong> – und dein Freund spart <strong>10€</strong>.
        </p>
      </motion.div>

      <Card className="border border-border bg-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Dein Empfehlungscode</CardTitle>
          <CardDescription>Code und Link teilen – beide führen zum gleichen Rabatt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {code && (
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div
                className={cn(
                  'flex-1 rounded-lg border bg-muted/50 px-4 py-3 font-mono text-lg tracking-wider text-center sm:text-left',
                  'border-border text-foreground'
                )}
              >
                {code}
              </div>
              <Button
                variant="outline"
                size="lg"
                className="shrink-0 gap-2"
                onClick={handleCopy}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="inline-flex items-center gap-2 text-green-600"
                    >
                      <Check className="h-5 w-5" /> Kopiert
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="inline-flex items-center gap-2"
                    >
                      <Copy className="h-5 w-5" /> Link kopieren
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          )}

          {link && (
            <p className="text-xs text-muted-foreground break-all font-mono bg-muted/30 rounded px-3 py-2">
              {link}
            </p>
          )}

          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-3">Teilen per</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleCopy}
              >
                <Share2 className="h-4 w-4" /> Kopieren
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`}
                className="inline-flex"
              >
                <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                  <Mail className="h-4 w-4" /> E-Mail
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 p-4 rounded-lg bg-muted/50 border border-border"
      >
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">So funktioniert's:</strong> Dein Freund klickt auf deinen Link,
          wird direkt zur Registrierung weitergeleitet – der Empfehlungscode ist bereits eingetragen.
          Nach dem Registrieren legt er etwas in den Warenkorb (Mindestbestellwert 50€) und erhält beim Checkout automatisch 10€ Rabatt.
          Nach erfolgreicher Zahlung werden dir 200 Treuepunkte gutgeschrieben und du erhältst eine E-Mail.
        </p>
      </motion.div>
    </div>
  )
}
