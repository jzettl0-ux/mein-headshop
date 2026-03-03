'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="de">
      <body className="min-h-screen bg-luxe-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Etwas ist schiefgelaufen</h1>
          <p className="text-luxe-silver mb-6">
            Ein unerwarteter Fehler ist aufgetreten. Wir wurden benachrichtigt und arbeiten daran.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-luxe-gold text-luxe-black font-semibold rounded-lg hover:bg-luxe-gold/90 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  )
}
