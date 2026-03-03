import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price in EUR
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

/** Umsatzsteuersatz in % (z. B. 19 für Deutschland) – für Preishinweise gemäß UStG */
export const VAT_RATE_PERCENT = 19

/**
 * Brutto → Netto (bei 19 % MwSt.)
 */
export function netFromGross(gross: number): number {
  return Math.round((gross / (1 + VAT_RATE_PERCENT / 100)) * 100) / 100
}

/**
 * Brutto → enthaltene MwSt. in €
 */
export function vatFromGross(gross: number): number {
  return Math.round((gross - netFromGross(gross)) * 100) / 100
}

/**
 * Format date in German locale
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj)
}

/**
 * Generate slug from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Versandkosten: Standard 4,90 €, kostenlos ab diesem Bestellwert (Brutto-Zwischensumme). */
export const FREE_SHIPPING_THRESHOLD_EUR = 50
const BASE_SHIPPING = 4.9
const ADULT_CHECK_FEE = 2.0

/**
 * Berechnet Versandkosten: 4,90 € (bzw. 6,90 € mit 18+), kostenlos ab FREE_SHIPPING_THRESHOLD_EUR.
 * @param items – Warenkorb-Positionen (für 18+-Prüfung)
 * @param subtotalEur – optionale Zwischensumme in €; wenn >= 50, Basis-Versand entfällt
 */
export function calculateShipping(
  items: Array<{ is_adult_only?: boolean; exempt_from_adult_fee?: boolean }>,
  subtotalEur?: number
): number {
  const hasAdultItems = items.some(
    (item) => item.is_adult_only && !item.exempt_from_adult_fee
  )
  const freeShipping = typeof subtotalEur === 'number' && subtotalEur >= FREE_SHIPPING_THRESHOLD_EUR
  const base = freeShipping ? 0 : BASE_SHIPPING
  const adultFee = hasAdultItems ? ADULT_CHECK_FEE : 0
  return Math.round((base + adultFee) * 100) / 100
}

/**
 * Validate age verification
 */
export function isAgeVerified(): boolean {
  if (typeof window === 'undefined') return false
  
  const verified = localStorage.getItem('age_verified')
  const verifiedDate = localStorage.getItem('age_verified_date')
  
  if (!verified || !verifiedDate) return false
  
  // Check if verification is still valid (30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  return new Date(verifiedDate) > thirtyDaysAgo
}

/**
 * Set age verification
 */
export function setAgeVerified(): void {
  if (typeof window === 'undefined') return

  localStorage.setItem('age_verified', 'true')
  localStorage.setItem('age_verified_date', new Date().toISOString())
}

/** UUID-Regex (v4-style: 8-4-4-4-12 hex) */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Prüft, ob ein String eine gültige UUID ist (Supabase/Postgres).
 * Verhindert "invalid input syntax for type uuid" bei alten Mock-IDs wie "prod-001".
 */
export function isValidUUID(value: string): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value)
}

/**
 * Gibt den effektiven Preis eines Produkts zurück (mit Produkt-Rabatt falls gültig).
 */
export function getEffectivePrice(product: {
  price: number
  discount_percent?: number
  discount_until?: string | null
}): number {
  const pct = product.discount_percent ?? 0
  if (pct <= 0) return product.price
  const until = product.discount_until
  if (until && new Date(until) < new Date()) return product.price
  return Math.round(product.price * (1 - pct / 100) * 100) / 100
}

/**
 * Prüft, ob ein Produkt aktuell einen Rabatt hat (für Anzeige).
 */
export function hasActiveDiscount(product: {
  discount_percent?: number
  discount_until?: string | null
}): boolean {
  const pct = product.discount_percent ?? 0
  if (pct <= 0) return false
  const until = product.discount_until
  if (until && new Date(until) < new Date()) return false
  return true
}

/**
 * Berechnet den anzuzeigenden Rabatt in Prozent aus alter und neuer Preisangabe.
 * Liefert null, wenn kein Rabatt (alter <= neuer).
 */
export function getDisplayDiscountPercent(oldPrice: number, newPrice: number): number | null {
  if (oldPrice <= 0 || newPrice >= oldPrice) return null
  const pct = Math.round(((oldPrice - newPrice) / oldPrice) * 100)
  return pct > 0 ? pct : null
}

/**
 * PAngV: Referenzpreis für Streichpreis-Anzeige.
 * Nur wenn reference_price_30d gesetzt und >= effektiver Preis, darf ein Streichpreis gezeigt werden
 * (niedrigster Preis der letzten 30 Tage – keine „Mondpreise“).
 * Gibt den anzuzeigenden Referenzpreis zurück oder null, wenn kein Streichpreis angezeigt werden darf.
 */
export function getReferencePriceForDisplay(product: {
  price: number
  discount_percent?: number
  discount_until?: string | null
  reference_price_30d?: number | null
}): number | null {
  if (!hasActiveDiscount(product)) return null
  const effective = getEffectivePrice(product)
  const ref = product.reference_price_30d
  if (ref == null || ref < effective) return null
  return ref
}

/** Tage, ab denen ein Produkt nicht mehr als „NEU“ gilt (ohne Override). */
const NEW_PRODUCT_DAYS = 14

/**
 * true, wenn das Produkt als „NEU“ markiert werden soll:
 * weniger als 14 Tage alt oder is_new_override = true.
 */
export function isNewProduct(product: {
  created_at?: string
  is_new_override?: boolean
}): boolean {
  if (product.is_new_override === true) return true
  const created = product.created_at
  if (!created) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - NEW_PRODUCT_DAYS)
  return new Date(created) >= cutoff
}
