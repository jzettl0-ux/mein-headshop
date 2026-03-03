'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SecurePasswordInput } from '@/components/auth/secure-password-input'
import { useToast } from '@/hooks/use-toast'
import { getCurrentUser, updatePassword } from '@/lib/supabase/auth'
import { allCriteriaMet } from '@/lib/password-validation'

export default function AuthResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hint, setHint] = useState('')
  const [status, setStatus] = useState<'checking' | 'ready' | 'expired'>('checking')
  const [success, setSuccess] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<{
    criteriaMet: boolean
    pwnedCount: number
  }>({ criteriaMet: false, pwnedCount: 0 })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false
    async function checkSession() {
      const user = await getCurrentUser()
      if (cancelled) return
      setStatus(user ? 'ready' : 'expired')
    }
    checkSession()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHint('')

    if (!allCriteriaMet(password)) {
      setHint('Bitte erfülle alle Passwort-Anforderungen.')
      return
    }
    if (passwordValidation.pwnedCount > 0) {
      setHint('Dieses Passwort wurde in Datenleaks gefunden. Bitte wähle ein anderes.')
      return
    }
    if (password !== passwordConfirm) {
      setHint('Die Passwörter stimmen nicht überein.')
      return
    }

    setIsLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
      toast({
        title: 'Passwort gespeichert',
        description: 'Du bist jetzt eingeloggt.',
      })
      router.push('/account')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Passwort konnte nicht gesetzt werden.'
      console.error('Reset password error:', err)
      setHint(message)
      toast({
        title: 'Hinweis',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const canSubmit =
    allCriteriaMet(password) &&
    passwordValidation.pwnedCount === 0 &&
    password === passwordConfirm &&
    password.length > 0

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#FDFBF5] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          <p className="text-neutral-500 text-sm">Link wird geprüft…</p>
        </div>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-[#FDFBF5] flex items-center justify-center p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-10 sm:p-12 shadow-sm text-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-neutral-800 mb-3">
              Link abgelaufen oder ungültig
            </h1>
            <p className="text-neutral-600 text-sm leading-relaxed mb-8">
              Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen Link an.
            </p>
            <Link href="/auth/forgot-password">
              <Button className="bg-neutral-800 hover:bg-neutral-700 text-white">
                Neuen Link anfordern
              </Button>
            </Link>
            <div className="mt-8">
              <Link
                href="/auth"
                className="text-sm text-neutral-600 hover:text-neutral-800"
              >
                ← Zurück zur Anmeldung
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FDFBF5] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <CheckCircle className="w-12 h-12 text-amber-600" />
          <p className="text-neutral-600 text-sm">Weiterleitung…</p>
        </div>
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
              <Lock className="w-7 h-7 text-amber-600" />
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl font-semibold text-neutral-800 mb-2">
              Neues Passwort setzen
            </h1>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Wähle ein sicheres Passwort. Du wirst nach dem Speichern automatisch eingeloggt.
            </p>
          </div>

          {hint && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600 text-sm"
              role="alert"
            >
              {hint}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <SecurePasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              placeholder="Mindestens 12 Zeichen"
              disabled={isLoading}
              autoComplete="new-password"
              label="Neues Passwort"
              variant="light"
              onValidationChange={setPasswordValidation}
            />

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm" className="text-neutral-700">
                Passwort wiederholen
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                <Input
                  id="passwordConfirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 pl-12 rounded-lg"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-amber-700 transition-colors p-1"
                  aria-label={showConfirm ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordConfirm && password !== passwordConfirm && (
                <p className="text-xs text-neutral-500">Die Passwörter stimmen nicht überein.</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white"
              disabled={isLoading || !canSubmit}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Wird gespeichert…
                </>
              ) : (
                'Passwort speichern'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/auth"
              className="text-sm text-neutral-600 hover:text-neutral-800"
            >
              ← Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
