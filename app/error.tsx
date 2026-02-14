'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'system-ui',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Etwas ist schiefgelaufen
        </h1>
        <p style={{ color: '#8a8a8a', marginBottom: '1.5rem' }}>
          {error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={reset}
            style={{
              background: '#D4AF37',
              color: '#0a0a0a',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Erneut versuchen
          </button>
          <a href="/" style={{ color: '#8a8a8a' }}>
            Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  )
}
