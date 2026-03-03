'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Lock, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  PASSWORD_CRITERIA,
  checkPasswordCriteria,
  allCriteriaMet,
  getPasswordStrength,
} from '@/lib/password-validation'

export interface SecurePasswordInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  autoComplete?: string
  className?: string
  label?: string
  error?: string
  /** Rückmeldung an Parent: criteriaMet und pwnedCount (für Submit-Button) */
  onValidationChange?: (status: { criteriaMet: boolean; pwnedCount: number }) => void
  /** 'light' für helle Hintergründe (Clean Luxe) */
  variant?: 'dark' | 'light'
}

/** Prüft optional gegen Have I Been Pwned (k-Anonymität, nur erste 5 Zeichen des SHA1-Hash) */
async function checkPwned(password: string): Promise<number> {
  if (!password) return 0
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    const prefix = hashHex.slice(0, 5).toUpperCase()
    const suffix = hashHex.slice(5).toUpperCase()
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { Accept: 'text/plain' },
    })
    if (!res.ok) return 0
    const text = await res.text()
    const lines = text.split('\r\n')
    for (const line of lines) {
      const [h, count] = line.split(':')
      if (h?.trim() === suffix) return parseInt(count ?? '0', 10)
    }
    return 0
  } catch {
    return 0
  }
}

export function SecurePasswordInput({
  id,
  value,
  onChange,
  placeholder = 'Mindestens 12 Zeichen',
  disabled = false,
  autoComplete = 'new-password',
  className = '',
  label = 'Passwort',
  error,
  onValidationChange,
  variant = 'dark',
}: SecurePasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [pwnedCount, setPwnedCount] = useState<number | null>(null)
  const [pwnedChecking, setPwnedChecking] = useState(false)

  const criteriaStatus = useMemo(() => checkPasswordCriteria(value), [value])
  const strength = useMemo(() => getPasswordStrength(value), [value])
  const isValid = useMemo(() => allCriteriaMet(value), [value])

  const handleBlur = useCallback(async () => {
    if (!value || value.length < 8) {
      setPwnedCount(null)
      onValidationChange?.({ criteriaMet: isValid, pwnedCount: 0 })
      return
    }
    setPwnedChecking(true)
    try {
      const count = await checkPwned(value)
      setPwnedCount(count)
      onValidationChange?.({ criteriaMet: isValid, pwnedCount: count })
    } catch {
      setPwnedCount(null)
      onValidationChange?.({ criteriaMet: isValid, pwnedCount: 0 })
    } finally {
      setPwnedChecking(false)
    }
  }, [value, isValid, onValidationChange])

  useEffect(() => {
    onValidationChange?.({
      criteriaMet: allCriteriaMet(value),
      pwnedCount: pwnedCount ?? 0,
    })
  }, [value, pwnedCount, onValidationChange])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
      setPwnedCount(null)
    },
    [onChange]
  )

  const strengthPercent = (strength / 4) * 100
  const isLight = variant === 'light'

  return (
    <div className={`space-y-2 ${className}`}>
      <Label
        htmlFor={id}
        className={isLight ? 'text-neutral-700' : 'text-white'}
      >
        {label}
      </Label>
      <div className="relative">
        <Lock
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${
            isLight ? 'text-neutral-400' : 'text-luxe-silver'
          }`}
        />
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={
            isLight
              ? 'bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 pl-12 pr-12 rounded-lg'
              : 'bg-luxe-gray border-luxe-silver text-white pl-12 pr-12 rounded-lg'
          }
          aria-invalid={!isValid && value.length > 0}
          aria-describedby={`${id}-criteria ${id}-strength ${pwnedCount != null && pwnedCount > 0 ? `${id}-pwned` : ''}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1 ${
            isLight ? 'text-neutral-400 hover:text-amber-700' : 'text-luxe-silver hover:text-luxe-gold'
          }`}
          aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* Stärke-Linie: dünne Linie, Grau → Gold */}
      <div
        id={`${id}-strength`}
        className={`h-0.5 rounded-full overflow-hidden ${
          isLight ? 'bg-neutral-200' : 'bg-luxe-gray/80'
        }`}
        role="progressbar"
        aria-valuenow={strengthPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Passwortstärke"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isLight ? 'bg-amber-600' : 'bg-luxe-gold'
          }`}
          style={{ width: `${Math.max(0, strengthPercent)}%` }}
        />
      </div>

      {/* Kriterien-Checkliste: Gold ✓ erfüllt, Grau offen */}
      <ul
        id={`${id}-criteria`}
        className={`flex flex-wrap gap-x-4 gap-y-1 text-xs ${
          isLight ? 'text-neutral-500' : 'text-luxe-silver'
        }`}
        role="list"
      >
        {PASSWORD_CRITERIA.map((c) => (
          <li
            key={c.id}
            className={`flex items-center gap-1.5 transition-colors ${
              criteriaStatus[c.id] ? (isLight ? 'text-amber-700' : 'text-luxe-gold') : ''
            }`}
          >
            {criteriaStatus[c.id] ? (
              <Check
                className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-700' : 'text-luxe-gold'}`}
                aria-hidden
              />
            ) : (
              <span
                className={`w-3.5 h-3.5 shrink-0 rounded-full border inline-block ${
                  isLight ? 'border-neutral-400' : 'border-luxe-silver/60'
                }`}
                aria-hidden
              />
            )}
            {c.label}
          </li>
        ))}
      </ul>

      {/* Pwned-Warnung: dezent, sanftes Orange */}
      {pwnedChecking && (
        <p
          className={`text-xs ${isLight ? 'text-neutral-500' : 'text-luxe-silver'}`}
          id={`${id}-pwned-loading`}
        >
          Prüfe Passwort gegen bekannte Datenleaks…
        </p>
      )}
      {!pwnedChecking && pwnedCount != null && pwnedCount > 0 && (
        <div
          id={`${id}-pwned`}
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
            isLight
              ? 'border-amber-300 bg-amber-50 text-amber-800'
              : 'border-amber-500/30 bg-amber-500/5 text-amber-200/90'
          }`}
          role="alert"
        >
          <AlertTriangle
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              isLight ? 'text-amber-600' : 'text-amber-400/80'
            }`}
          />
          <p>
            Dieses Passwort wurde in {pwnedCount.toLocaleString('de-DE')} bekannten Datenleaks gefunden.
            Bitte wähle ein anderes Passwort.
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-neutral-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
