'use client'

import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      render: (container: string | HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
        'expired-callback'?: () => void
        theme?: 'light' | 'dark'
        size?: 'normal' | 'compact'
      }) => number
      reset: (widgetId?: number) => void
    }
    onRecaptchaLoad?: () => void
  }
}

const SCRIPT_URL = 'https://www.google.com/recaptcha/api.js'
const SCRIPT_ID = 'recaptcha-script'

export interface RecaptchaProps {
  /** Öffentlicher Site-Key (NEXT_PUBLIC_RECAPTCHA_SITE_KEY) */
  siteKey: string
  /** Wird mit dem Token aufgerufen, sobald der Nutzer die Prüfung bestanden hat */
  onVerify: (token: string) => void
  /** Wird aufgerufen, wenn der Token abläuft (z. B. Nutzer wartet zu lange) */
  onExpire?: () => void
  /** Dunkles Theme für dunkle Seiten */
  theme?: 'light' | 'dark'
  /** Kompakte Darstellung */
  size?: 'normal' | 'compact'
  /** Optional: Widget-Id für programmatisches Zurücksetzen (z. B. nach Absenden) */
  onWidgetId?: (id: number) => void
}

/**
 * Google reCAPTCHA v2 – „Ich bin kein Roboter“ + ggf. Bild-Aufgaben.
 * Script wird einmal global geladen, Widget wird in den Container gerendert.
 */
export function Recaptcha({
  siteKey,
  onVerify,
  onExpire,
  theme = 'dark',
  size = 'normal',
  onWidgetId,
}: RecaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<number | null>(null)

  const onVerifyStable = useCallback(onVerify, [onVerify])
  const onExpireStable = useCallback(() => {
    onExpire?.()
  }, [onExpire])

  useEffect(() => {
    if (!siteKey || !containerRef.current) return

    function renderWidget() {
      if (!window.grecaptcha || !containerRef.current) return
      containerRef.current.innerHTML = ''
      const id = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onVerifyStable(token),
        'expired-callback': onExpireStable,
        theme,
        size,
      })
      widgetIdRef.current = id
      onWidgetId?.(id)
    }

    if (window.grecaptcha) {
      window.grecaptcha.ready(renderWidget)
      return
    }

    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      window.onRecaptchaLoad = renderWidget
      return () => {
        window.onRecaptchaLoad = undefined
      }
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = `${SCRIPT_URL}?onload=onRecaptchaLoad`
    script.async = true
    script.defer = true
    window.onRecaptchaLoad = () => {
      window.grecaptcha?.ready(renderWidget)
      window.onRecaptchaLoad = undefined
    }
    document.head.appendChild(script)

    return () => {
      if (widgetIdRef.current != null && window.grecaptcha?.reset) {
        try {
          window.grecaptcha.reset(widgetIdRef.current)
        } catch {
          // ignore
        }
      }
    }
  }, [siteKey, theme, size, onVerifyStable, onExpireStable, onWidgetId])

  if (!siteKey) return null

  return (
    <div className="recaptcha-wrapper flex justify-center md:justify-start">
      <div ref={containerRef} />
    </div>
  )
}

/**
 * Setzt das reCAPTCHA-Widget zurück (z. B. nach erfolgreichem Absenden).
 * Nur aufrufen, wenn du die widgetId von onWidgetId gespeichert hast.
 */
export function resetRecaptcha(widgetId: number) {
  if (typeof window !== 'undefined' && window.grecaptcha?.reset) {
    window.grecaptcha.reset(widgetId)
  }
}
