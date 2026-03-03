/**
 * E-Mail des Inhabers (voller Admin-Zugriff, Staff-Check umgangen).
 * Optional über Umgebungsvariable ADMIN_OWNER_EMAIL setzbar.
 */
export const OWNER_EMAIL =
  (typeof process !== 'undefined' && process.env?.ADMIN_OWNER_EMAIL) || 'jzettl0@gmail.com'
