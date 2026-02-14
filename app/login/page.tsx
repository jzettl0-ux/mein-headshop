'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Mail, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { signIn } from '@/lib/supabase/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await signIn(email, password)
      
      toast({
        title: 'Login erfolgreich',
        description: 'Willkommen zurück!',
      })
      
      // Redirect to admin
      router.push('/admin')
    } catch (err: any) {
      console.error('Login error:', err)
      
      if (err.message.includes('Invalid login credentials')) {
        setError('Falsche E-Mail oder Passwort')
      } else if (err.message.includes('Email not confirmed')) {
        setError('Bitte bestätige zuerst deine E-Mail-Adresse')
      } else {
        setError('Login fehlgeschlagen. Bitte versuche es erneut.')
      }
      
      toast({
        title: 'Login fehlgeschlagen',
        description: error || 'Bitte überprüfe deine Eingaben.',
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
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-luxe-gold to-luxe-neon rounded-2xl flex items-center justify-center">
              <Lock className="w-10 h-10 text-luxe-black" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin-Login
            </h1>
            <p className="text-luxe-silver">
              Premium Headshop Verwaltung
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
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
                  placeholder="admin@example.com"
                  className="bg-luxe-gray border-luxe-silver text-white pl-12"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Passwort
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
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-luxe-silver hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="luxe"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>
          </form>

          {/* Info */}
          <div className="mt-8 p-4 bg-luxe-gold/10 border border-luxe-gold/30 rounded-lg">
            <p className="text-xs text-luxe-gold text-center">
              <strong>🔒 Sicherer Login</strong>
            </p>
            <p className="text-xs text-luxe-silver text-center mt-2">
              Nur autorisierte Admin-Accounts haben Zugriff.
              <br />
              Verwende deine Supabase-Credentials.
            </p>
          </div>

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
