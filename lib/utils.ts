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

/**
 * Calculate shipping cost based on cart items
 */
export function calculateShipping(items: Array<{ is_adult_only?: boolean }>): number {
  const hasAdultItems = items.some(item => item.is_adult_only)
  const baseShipping = 4.90
  const adultCheckFee = 2.00
  
  return hasAdultItems ? baseShipping + adultCheckFee : baseShipping
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
