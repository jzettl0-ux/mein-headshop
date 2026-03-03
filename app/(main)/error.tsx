'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Main area error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-luxe-black flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Etwas ist schiefgelaufen</h1>
        <p className="text-luxe-silver mb-8">
          {error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="luxe" onClick={reset}>
            Erneut versuchen
          </Button>
          <Button variant="outline" className="border-luxe-gold text-luxe-gold" asChild>
            <Link href="/">Zur Startseite</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
