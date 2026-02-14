'use client'

/**
 * Fängt Fehler im Root-Layout ab – verhindert weiße Seite bei Absturz.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="de">
      <body style={{ background: '#0a0a0a', color: '#fff', fontFamily: 'system-ui', padding: '2rem', minHeight: '100vh' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Fehler</h1>
          <p style={{ color: '#8a8a8a', marginBottom: '1.5rem' }}>
            {error?.message || 'Ein Fehler ist aufgetreten.'}
          </p>
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
          <p style={{ marginTop: '1.5rem' }}>
            <a href="/" style={{ color: '#D4AF37' }}>Zur Startseite</a>
          </p>
        </div>
      </body>
    </html>
  )
}
