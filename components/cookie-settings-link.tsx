'use client'

import { OPEN_CONSENT_BANNER_EVENT } from '@/lib/consent-v3'

/**
 * Link/Button, der die Cookie-Einstellungen (ConsentBanner-Modal) öffnet.
 * Für Footer: "Cookie-Einstellungen" – Nutzer kann jederzeit Anpassungen vornehmen.
 * Es gibt nur einen Banner: components/consent/ConsentBanner.tsx (siehe docs/COOKIE-BANNER.md).
 */
export function CookieSettingsLink({
  className,
  children = 'Cookie-Einstellungen',
}: {
  className?: string
  children?: React.ReactNode
}) {
  const open = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OPEN_CONSENT_BANNER_EVENT))
    }
  }
  return (
    <button
      type="button"
      onClick={open}
      className={className}
    >
      {children}
    </button>
  )
}
