'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SecurePasswordInput } from '@/components/auth/secure-password-input'
import { Gift } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { signIn, signOut } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase'
import { allCriteriaMet } from '@/lib/password-validation'
import Link from 'next/link'
import { setStoredReferralCode } from '@/components/referral-capture'

type AuthMode = 'login' | 'register'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<{
    criteriaMet: boolean
    pwnedCount: number
  }>({ criteriaMet: false, pwnedCount: 0 })
  const [referralCode, setReferralCode] = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const redirectTo = searchParams.get('redirect') || '/account'
  const isAdminRedirect = redirectTo.startsWith('/admin')
  const wasDeleted = searchParams.get('deleted') === '1'

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref && typeof ref === 'string' && ref.trim().length >= 4) {
      const code = ref.trim().toUpperCase()
      setMode('register')
      setReferralCode(code)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(email, password)

      if (isAdminRedirect) {
        const meRes = await fetch('/api/admin/me')
        if (!meRes.ok) {
          await signOut()
          toast({
            title: 'Kein Zugang',
            description: 'Dieser Account hat keine Admin-Berechtigung.',
            variant: 'destructive',
          })
          setIsLoading(false)
          return
        }
      }

      toast({
        title: 'Login erfolgreich',
        description: 'Willkommen zurück!',
      })

      router.push(redirectTo)
    } catch (err: any) {
      console.error('Login error:', err)
      toast({
        title: 'Login fehlgeschlagen',
        description: err.message || 'Bitte überprüfe deine Eingaben.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allCriteriaMet(password)) {
      toast({
        title: 'Passwort erfüllt die Anforderungen nicht',
        description: 'Bitte prüfe die Hinweise unter dem Passwortfeld.',
        variant: 'destructive',
      })
      return
    }
    if (passwordValidation.pwnedCount > 0) {
      toast({
        title: 'Passwort unsicher',
        description: 'Dieses Passwort wurde in Datenleaks gefunden. Bitte wähle ein anderes.',
        variant: 'destructive',
      })
      return
    }
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      })

      if (error) throw error

      if (newsletterOptIn && email) {
        try {
          await fetch('/api/newsletter/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase(), source: 'registration' }),
          })
        } catch { /* ignore */ }
      }

      toast({
        title: 'Registrierung erfolgreich',
        description: 'Bitte bestätige deine E-Mail-Adresse.',
      })

      // Auto-Login nach Registrierung (wenn Email-Confirm disabled)
      if (data.session) {
        router.push(redirectTo)
      } else {
        setMode('login')
      }
    } catch (err: any) {
      console.error('Register error:', err)
      toast({
        title: 'Registrierung fehlgeschlagen',
        description: err.message || 'Bitte versuche es erneut.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-luxe-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-luxe-charcoal border border-luxe-gray rounded-2xl p-8 shadow-2xl">
          {wasDeleted && (
            <div className="mb-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200">
              Ihr Konto wurde gelöscht. Sie können sich jederzeit wieder registrieren.
            </div>
          )}

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-16 h-16 bg-gradient-to-br from-luxe-gold to-luxe-neon rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-luxe-black" />
              </div>
            </Link>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {mode === 'login' ? 'Willkommen zurück' : 'Konto erstellen'}
            </h1>
            <p className="text-luxe-silver">
              {mode === 'login' 
                ? 'Melde dich an, um deine Bestellungen zu sehen'
                : 'Erstelle ein Konto für schnelleren Checkout'
              }
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-luxe-gray p-1 rounded-lg">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md font-medium transition-all ${
                mode === 'login'
                  ? 'bg-luxe-gold text-luxe-black'
                  : 'text-luxe-silver hover:text-white'
              }`}
            >
              Anmelden
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-md font-medium transition-all ${
                mode === 'register'
                  ? 'bg-luxe-gold text-luxe-black'
                  : 'text-luxe-silver hover:text-white'
              }`}
            >
              Registrieren
            </button>
          </div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    E-Mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxe-silver" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.com"
                      className="bg-luxe-gray border-luxe-silver text-white pl-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-white">
                      Passwort
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-luxe-silver hover:text-luxe-gold transition-colors"
                    >
                      Passwort vergessen?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxe-silver" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-luxe-gray border-luxe-silver text-white pl-12 pr-12"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-luxe-silver hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="luxe"
                  size="lg"
                  className="w-full mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxe-silver" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Max Mustermann"
                      className="bg-luxe-gray border-luxe-silver text-white pl-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-white">
                    E-Mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxe-silver" />
                    <Input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.com"
                      className="bg-luxe-gray border-luxe-silver text-white pl-12"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <SecurePasswordInput
                  id="register-password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Mindestens 12 Zeichen"
                  disabled={isLoading}
                  autoComplete="new-password"
                  label="Passwort"
                  onValidationChange={setPasswordValidation}
                />

                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-luxe-gold/40 bg-luxe-gold/5 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={newsletterOptIn}
                    onChange={(e) => setNewsletterOptIn(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-luxe-gold focus:ring-luxe-gold"
                  />
                  <div>
                    <span className="text-white text-sm font-medium">Newsletter abonnieren</span>
                    <p className="text-luxe-silver text-xs mt-0.5">Erhalte Willkommens-Rabatt und Neuigkeiten per E-Mail.</p>
                    <p className="text-luxe-silver/40 text-[10px] mt-1 leading-tight">
                      Hinweise zum Rabattversand und zur Verarbeitung findest du in unserer{' '}
                      <Link href="/privacy" className="text-luxe-silver/50 hover:underline">Datenschutzerklärung</Link>.
                    </p>
                  </div>
                </label>

                <div className="rounded-lg border border-luxe-gold/40 bg-luxe-gold/5 px-4 py-3">
                  <Label htmlFor="referral" className="text-luxe-silver text-xs">
                    Empfehlungscode <span className="text-luxe-silver/70">(optional)</span>
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Gift className="w-5 h-5 text-luxe-gold shrink-0" />
                    <Input
                      id="referral"
                      value={referralCode}
                      onChange={(e) => {
                        const v = e.target.value.trim().toUpperCase()
                        setReferralCode(v)
                        if (v.length >= 4) setStoredReferralCode(v)
                      }}
                      placeholder="z. B. ABC12XYZ"
                      className="bg-luxe-gray border-luxe-silver text-white font-mono"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-luxe-silver mt-1">
                    10€ Rabatt ab 50€ Bestellwert – beim Checkout automatisch angewendet
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="luxe"
                  size="lg"
                  className="w-full mt-6"
                  disabled={
                    isLoading ||
                    !allCriteriaMet(password) ||
                    passwordValidation.pwnedCount > 0
                  }
                >
                  {isLoading ? 'Wird erstellt...' : 'Konto erstellen'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-luxe-silver hover:text-white transition-colors"
            >
              ← Zurück zum Shop
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
