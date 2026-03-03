/**
 * Passwort-Validierung für Registrierung (Security)
 * Kriterien: min. 12 Zeichen, Groß-/Kleinschreibung, Zahl, Sonderzeichen
 */

export interface PasswordCriteria {
  id: string
  label: string
  test: (pwd: string) => boolean
}

export const PASSWORD_CRITERIA: PasswordCriteria[] = [
  { id: 'length', label: 'Mindestens 12 Zeichen', test: (p) => p.length >= 12 },
  { id: 'lower', label: 'Kleinbuchstabe', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'Großbuchstabe', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Zahl', test: (p) => /[0-9]/.test(p) },
  {
    id: 'special',
    label: 'Sonderzeichen (!@#$%^&* etc.)',
    test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p),
  },
]

export function checkPasswordCriteria(password: string): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const c of PASSWORD_CRITERIA) {
    result[c.id] = c.test(password)
  }
  return result
}

export function allCriteriaMet(password: string): boolean {
  return PASSWORD_CRITERIA.every((c) => c.test(password))
}

export function getPasswordStrength(password: string): number {
  if (!password) return 0
  try {
    // zxcvbn: 0–4 (sehr schwach bis sehr stark)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const zxcvbn = require('zxcvbn')
    const result = zxcvbn.default ? zxcvbn.default(password) : zxcvbn(password)
    return result.score
  } catch {
    // Fallback: einfache Heuristik
    let score = 0
    if (password.length >= 12) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    return Math.min(4, Math.floor(score * 0.8))
  }
}
