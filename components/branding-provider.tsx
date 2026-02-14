'use client'

import { useEffect, useState } from 'react'

/**
 * Lädt Branding-Farben von der API und setzt sie als CSS-Variablen.
 * So können Admin-Einstellungen die gesamte Seite stylen.
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const apply = async () => {
      try {
        const root = document.documentElement
        const isLightTheme = root.classList.contains('theme-light')
        if (isLightTheme) {
          setMounted(true)
          return
        }
        const res = await fetch('/api/settings')
        const data = (await res.json()) as Record<string, string>
        for (const [key, value] of Object.entries(data)) {
          if (value) root.style.setProperty('--luxe-' + key, value)
        }
      } catch {
        // Fallback bleibt in globals.css
      }
      setMounted(true)
    }
    apply()
  }, [])

  return <>{children}</>
}
