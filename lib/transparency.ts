import { randomBytes } from 'crypto'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // ohne 0,O,1,I
const DEFAULT_LENGTH = 12

/** Generiert kryptografisch sicheren, nicht-sequentiellen Code (7–20 Zeichen) */
export function generateTransparencyCode(length: number = DEFAULT_LENGTH): string {
  const buf = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CHARS[buf[i]! % CHARS.length]
  }
  return out
}
