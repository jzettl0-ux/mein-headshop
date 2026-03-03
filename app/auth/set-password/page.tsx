'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getCurrentUser, updatePassword } from '@/lib/supabase/auth'

const MIN_LENGTH = 8

export default function AuthSetPasswordPage() {
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'checking' | 'ready' | 'expired'>('checking')
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
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < MIN_LENGTH) {
      setError(`Mindestens ${MIN_LENGTH} Zeichen erforderlich.`)
      return
    }
    if (password !== passwordConfirm) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setIsLoading(true)
    try {
      await updatePassword(password)
      toast({
        title: 'Passwort gespeichert',
        description: 'Bitte melde dich mit deinem neuen Passwort an.',
      })
      router.push('/auth')
    } catch (err: any) {
      console.error('Set password error:', err)
      setError(err?.message || 'Passwort konnte nicht gesetzt werden.')
      toast({
        title: 'Fehler',
        description: err?.message || 'Bitte versuche es erneut.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center p-4">
        <div className="text-luxe-silver">Link wird geprüft...</div>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-luxe-charcoal border border-luxe-gray rounded-2xl p-8 shadow-2xl text-center">
            <AlertCircle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Link abgelaufen oder ungültig</h1>
            <p className="text-luxe-silver mb-6">
              Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen Link an.
            </p>
            <Link href="/auth/forgot-password">
              <Button variant="luxe">Neuen Link anfordern</Button>
            </Link>
            <div className="mt-6">
              <Link href="/auth" className="text-sm text-luxe-silver hover:text-white">
                ← Zurück zur Anmeldung
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxe-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-luxe-charcoal border border-luxe-gray rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-luxe-gold to-luxe-neon rounded-2xl flex items-center justify-center">
              <Lock className="w-7 h-7 text-luxe-black" />
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Neues Passwort setzen</h1>
            <p className="text-luxe-silver text-sm">
              Wähle ein sicheres Passwort (mind. {MIN_LENGTH} Zeichen, empfohlen 12+). Danach melde dich mit dem neuen Passwort an.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Neues Passwort
              </Label>
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
                  minLength={MIN_LENGTH}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-luxe-silver hover:text-white"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-luxe-silver">
                Mind. {MIN_LENGTH} Zeichen; empfohlen: 12+ Zeichen, Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm" className="text-white">
                Passwort wiederholen
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxe-silver" />
                <Input
                  id="passwordConfirm"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="bg-luxe-gray border-luxe-silver text-white pl-12"
                  required
                  minLength={MIN_LENGTH}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="luxe"
              size="lg"
              className="w-full"
              disabled={isLoading || password.length < MIN_LENGTH || password !== passwordConfirm}
            >
              {isLoading ? 'Wird gespeichert...' : 'Passwort speichern'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth" className="text-sm text-luxe-silver hover:text-white">
              ← Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
