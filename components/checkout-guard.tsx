'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * PCI DSS 4.0.1 / E-Skimming-Schutz: Überwacht die Bezahlseite auf unerwartete
 * DOM-Änderungen (injizierte Skripte/iframes). Bei Verdacht kann gewarnt werden.
 */
const ALLOWED_SCRIPT_ORIGINS = ['self', 'mollie.com', 'js.mollie.com']
const ALLOWED_IFRAME_ORIGINS = ['mollie.com']

function getOrigin(url: string | null): string {
  if (!url) return ''
  try {
    return new URL(url, window.location.origin).origin
  } catch {
    return ''
  }
}

function isAllowedScript(src: string | null): boolean {
  if (!src) return true
  const origin = getOrigin(src)
  return ALLOWED_SCRIPT_ORIGINS.some((o) => origin.includes(o) || src.startsWith('blob:') || src.startsWith('data:'))
}

function isAllowedIframe(src: string | null): boolean {
  if (!src) return true
  const origin = getOrigin(src)
  return ALLOWED_IFRAME_ORIGINS.some((o) => origin.includes(o))
}

export function CheckoutGuard() {
  const [anomaly, setAnomaly] = useState<string | null>(null)
  const observedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || observedRef.current) return
    observedRef.current = true

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue
          const el = node as Element
          if (el.tagName === 'SCRIPT') {
            const src = (el as HTMLScriptElement).src
            if (src && !isAllowedScript(src)) {
              setAnomaly(`Unerwartetes Skript: ${src.slice(0, 80)}`)
            }
          }
          if (el.tagName === 'IFRAME') {
            const src = (el as HTMLIFrameElement).src
            if (src && !isAllowedIframe(src)) {
              setAnomaly(`Unerwarteter iframe: ${src.slice(0, 80)}`)
            }
          }
        }
      }
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  if (!anomaly) return null

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 z-[9999] rounded-lg border-2 border-amber-500 bg-amber-950/95 p-4 text-amber-100 shadow-lg"
      aria-live="assertive"
    >
      <p className="font-semibold">Sicherheitshinweis</p>
      <p className="text-sm mt-1">
        Es wurde eine unerwartete Änderung auf dieser Seite erkannt. Bitte schließe diesen Tab und starte die Zahlung erneut über die offizielle Shop-Seite.
      </p>
    </div>
  )
}
