/**
 * Einfacher In-Memory-Rate-Limiter für Passwort-Reset (OWASP: Rate-Limiting pro Konto/IP).
 * Für Produktion mit mehreren Instanzen: Redis/Upstash verwenden.
 */

const store = new Map<string, { count: number; resetAt: number }>()

const CLEANUP_INTERVAL_MS = 60_000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function scheduleCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key)
    }
    if (store.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer)
      cleanupTimer = null
    }
  }, CLEANUP_INTERVAL_MS)
}

/**
 * Prüft, ob der Schlüssel (z. B. IP oder E-Mail) das Limit überschritten hat.
 * @param key Eindeutiger Schlüssel (z. B. "ip:1.2.3.4" oder "email:user@example.com")
 * @param maxRequests Maximale Anzahl Anfragen im Zeitfenster
 * @param windowSeconds Zeitfenster in Sekunden
 * @returns true wenn erlaubt, false wenn Rate-Limit überschritten
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; remaining: number; resetAt: number } {
  scheduleCleanup()
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const entry = store.get(key)

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  if (entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  entry.count += 1
  const allowed = entry.count <= maxRequests
  return {
    allowed,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
  }
}

/** Limits für Passwort-Reset (OWASP-orientiert) */
export const PASSWORD_RESET_LIMITS = {
  /** Pro IP: max 5 Anfragen pro 15 Minuten */
  perIp: { max: 5, windowSeconds: 15 * 60 },
  /** Pro E-Mail: max 2 Anfragen pro Stunde (gegen E-Mail-Flooding) */
  perEmail: { max: 2, windowSeconds: 60 * 60 },
} as const
