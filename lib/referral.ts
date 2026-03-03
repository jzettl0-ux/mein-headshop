/**
 * Refer-a-Friend: Konstanten und Hilfsfunktionen
 */
export const REFERRAL_DISCOUNT_EUR = 10
export const REFERRAL_MIN_ORDER_SUBTOTAL = 50
export const REFERRAL_POINTS_REWARD = 200

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

export function generateReferralCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

export function isValidReferralCodeFormat(code: unknown): code is string {
  return typeof code === 'string' && /^[A-Z0-9]{6,12}$/.test(code.trim())
}
