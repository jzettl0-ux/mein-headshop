/**
 * Gemeinsame E-Mail-Farben – helles Shop-Design (theme-light).
 * Warme Cremetöne, Weiß, Grün-Akzente – identisch mit dem Layout in send-order-email.ts.
 */
export const emailStyles = {
  /** Haupt-Hintergrund (warmer Cremeton wie Shop) */
  background: '#FDFBF5',
  /** Karten/Boxen */
  cardBg: '#FFFFFF',
  /** Rahmen, Trennlinien */
  border: '#e5e5e5',
  /** Fließtext */
  text: '#262626',
  /** Sekundärtext */
  textMuted: '#525252',
  /** Primärfarbe Grün (Akzente, Links) – wie theme-light */
  primary: '#2D5A2D',
  /** Grün hell (Hervorhebungen) */
  primaryLight: '#3D8B3D',
  /** Grün dunkel (Buttons, Kontrast) */
  primaryDark: '#1e4620',
  /** Header-Hintergrund: hell, Logo gut erkennbar, nicht weiß */
  headerBg: '#F5F5F5',
  /** Footer / kleine Schrift */
  footer: '#525252',
} as const

export type EmailStyles = typeof emailStyles
