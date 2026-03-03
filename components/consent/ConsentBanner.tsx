'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { initConsentModeDefault, updateConsent, getDefaultDenied, type ConsentState, type ConsentStateExtended } from '@/lib/gtag'
import { getConsentCookieExtended, setConsentCookie, hasConsentChoice, OPEN_CONSENT_BANNER_EVENT } from '@/lib/consent-v3'

const DEFAULT_DENIED: ConsentStateExtended = {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functional_storage: 'denied',
}

const ALL_GRANTED: ConsentStateExtended = {
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  functional_storage: 'granted',
}

export function ConsentBanner() {
  const [mounted, setMounted] = useState(false)
  const [chosen, setChosen] = useState(true)
  const [showGranular, setShowGranular] = useState(false)
  const [functional, setFunctional] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [personalization, setPersonalization] = useState(false)

  const loadState = useCallback(() => {
    const stored = getConsentCookieExtended()
    setChosen(hasConsentChoice())
    if (stored) {
      setFunctional(stored.functional_storage === 'granted')
      setMarketing(stored.ad_storage === 'granted')
      setAnalytics(stored.analytics_storage === 'granted')
      setPersonalization(stored.ad_personalization === 'granted')
    } else {
      setFunctional(false)
      setMarketing(false)
      setAnalytics(false)
      setPersonalization(false)
    }
  }, [])

  useEffect(() => {
    initConsentModeDefault()
    loadState()
    setMounted(true)
  }, [loadState])

  useEffect(() => {
    const open = () => {
      loadState()
      setShowGranular(true)
      setChosen(false)
    }
    window.addEventListener(OPEN_CONSENT_BANNER_EVENT, open)
    return () => window.removeEventListener(OPEN_CONSENT_BANNER_EVENT, open)
  }, [loadState])

  const persistAndClose = useCallback((state: ConsentState | ConsentStateExtended) => {
    setConsentCookie(state)
    updateConsent(state)
    setChosen(true)
    setShowGranular(false)
    fetch('/api/consent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }).catch(() => {})
  }, [])

  const acceptAll = () => persistAndClose(ALL_GRANTED)

  const acceptNecessaryOnly = () => persistAndClose(DEFAULT_DENIED)

  const saveGranular = () => {
    const marketingOrPersonalization = marketing || personalization
    const state: ConsentStateExtended = {
      ad_storage: marketingOrPersonalization ? 'granted' : 'denied',
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_user_data: marketingOrPersonalization ? 'granted' : 'denied',
      ad_personalization: marketingOrPersonalization ? 'granted' : 'denied',
      functional_storage: functional ? 'granted' : 'denied',
    }
    persistAndClose(state)
  }

  if (!mounted) return null

  return (
    <>
      {!chosen && (
        <div
          role="dialog"
          aria-label="Cookie-Einstellungen"
          className="fixed bottom-0 left-0 right-0 z-[100] border border-[#E5E5E5] border-b-0 bg-white shadow-[0_-2px_16px_rgba(0,0,0,0.04)]"
        >
          <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              Wir respektieren Ihre Datensouveränität. Sie entscheiden, welche Kategorien von Cookies und
              ähnlichen Technologien wir nutzen dürfen. Notwendige Technologien sind für den Betrieb der
              Website unverzichtbar und werden nicht deaktiviert.{' '}
              <Link href="/privacy#cookies" className="text-[#1A1A1A] underline underline-offset-2 hover:no-underline">
                Mehr in der Datenschutzerklärung
              </Link>
            </p>

            {!showGranular ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#E5E5E5] pt-4">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="consent-banner-primary inline-flex items-center justify-center rounded-md border border-[var(--luxe-primary)] px-4 py-2 text-sm font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxe-primary)] focus-visible:ring-offset-2"
                >
                  Alle akzeptieren
                </button>
                <button
                  type="button"
                  onClick={acceptNecessaryOnly}
                  className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  Nur Notwendige
                </button>
                <button
                  type="button"
                  onClick={() => setShowGranular(true)}
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  Anpassen
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mt-4 border-t border-[#E5E5E5] pt-4">
                <button
                  type="button"
                  onClick={() => setShowGranular(false)}
                  className="mb-3 flex items-center gap-1 text-xs text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  Schnellauswahl
                </button>
                <p className="text-xs text-[#6B6B6B] mb-3">
                  Sie können Ihre Präferenzen für jede Kategorie individuell anpassen. Notwendige Technologien sind für den Betrieb der Website erforderlich.
                </p>
                <div className="space-y-3">
                  <label className="flex cursor-not-allowed items-start gap-3 opacity-75">
                    <input type="checkbox" checked disabled className="mt-1 h-4 w-4 rounded border-[#C4C4C4]" />
                    <span className="text-sm text-[#1A1A1A]">
                      <strong>Notwendig</strong> – Unverzichtbar für Funktionalität, Sicherheit und Betrugsprävention (z. B. Warenkorb, Anmeldung).
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={functional}
                      onChange={(e) => setFunctional(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#C4C4C4] text-[#1A1A1A] focus:ring-[#1A1A1A]"
                    />
                    <span className="text-sm text-[#1A1A1A]">
                      <strong>Funktional</strong> – Verbessern die Nutzung durch gespeicherte Einstellungen und Präferenzen.
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#C4C4C4] text-[#1A1A1A] focus:ring-[#1A1A1A]"
                    />
                    <span className="text-sm text-[#1A1A1A]">
                      <strong>Analyse</strong> – Aggregierte Nutzungsstatistiken zur Verbesserung unseres Angebots (z. B. Google Analytics).
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={marketing || personalization}
                      onChange={(e) => {
                        setMarketing(e.target.checked)
                        setPersonalization(e.target.checked)
                      }}
                      className="mt-1 h-4 w-4 rounded border-[#C4C4C4] text-[#1A1A1A] focus:ring-[#1A1A1A]"
                    />
                    <span className="text-sm text-[#1A1A1A]">
                      <strong>Personalisierung & Werbung</strong> – Nutzerprofile für zielgerichtete Werbung und Remarketing (z. B. Google Ads).
                    </span>
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveGranular}
                    className="consent-banner-primary inline-flex items-center justify-center rounded-md border border-[var(--luxe-primary)] px-4 py-2 text-sm font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxe-primary)] focus-visible:ring-offset-2"
                  >
                    Auswahl speichern
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGranular(false)}
                    className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
