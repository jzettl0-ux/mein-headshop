'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { requestPasswordReset } from '@/lib/supabase/auth'
import { Recaptcha } from '@/components/recaptcha'

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

/** Einheitliche Meldung – verhindert User-Enumeration */
const SUCCESS_MESSAGE =
  'Falls diese E-Mail bei uns registriert ist, wurde ein Link zum Zurücksetzen gesendet. Bitte prüfe auch den Spam-Ordner.'

export default function AuthForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()

  const captchaRequired = !!RECAPTCHA_SITE_KEY

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    if (captchaRequired && !captchaToken) {
      toast({
        title: 'Sicherheitsprüfung erforderlich',
        description: 'Bitte die Prüfung abschließen.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectTo = `${baseUrl}/auth/reset-password`
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          captcha_token: captchaToken || undefined,
          redirect_to: '/auth/reset-password',
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 429) {
        toast({
          title: 'Zu viele Anfragen',
          description: data.error || 'Bitte später erneut versuchen.',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }
      if (res.status === 400) {
        toast({
          title: 'Sicherheitsprüfung',
          description: data.error || 'Bitte versuche es erneut.',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }
      if (res.status === 503 && data.error) {
        await requestPasswordReset(trimmed, redirectTo)
      }
      setSent(true)
      toast({ title: 'E-Mail gesendet', description: SUCCESS_MESSAGE })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'E-Mail konnte nicht gesendet werden.'
      console.error('Forgot password error:', err)
      toast({
        title: 'Hinweis',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#FDFBF5] flex items-center justify-center p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-10 sm:p-12 shadow-sm text-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-neutral-800 mb-3">
              E-Mail gesendet
            </h1>
            <p className="text-neutral-600 text-sm leading-relaxed mb-8">
              {SUCCESS_MESSAGE}
            </p>
            <Link href="/auth">
              <Button className="bg-neutral-800 hover:bg-neutral-700 text-white">
                Zurück zur Anmeldung
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF5] flex items-center justify-center p-6 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-10 sm:p-12 shadow-sm">
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
              <Mail className="w-7 h-7 text-amber-600" />
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl font-semibold text-neutral-800 mb-2">
              Passwort vergessen?
            </h1>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Gib deine E-Mail-Adresse ein. Wir senden dir einen Link, mit dem du ein neues Passwort setzen kannst.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-700">
                E-Mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.com"
                  className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 pl-12 rounded-lg"
                  required
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {captchaRequired && (
              <div>
                <Label className="text-neutral-700 block mb-2">Sicherheitsprüfung</Label>
                <Recaptcha
                  siteKey={RECAPTCHA_SITE_KEY}
                  theme="light"
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken('')}
                />
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white"
              disabled={isLoading || (captchaRequired && !captchaToken)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Wird gesendet…
                </>
              ) : (
                'Link zum Zurücksetzen senden'
              )}
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4 text-neutral-500" />
            <Link
              href="/auth"
              className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
