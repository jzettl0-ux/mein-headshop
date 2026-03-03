/**
 * Broken Object Level Authorization (BOLA) – OWASP API Security.
 * Jeder Zugriff auf ressourcenbezogene Endpunkte (Bestellung, Profil) muss prüfen:
 * session user_id === resource owner_id (z. B. order.user_id).
 * Bei Missmatch: 403 mit generischer Meldung (kein Information Leak).
 */

export function assertResourceOwner(
  resourceOwnerId: string | null,
  sessionUserId: string
): { allowed: true } | { allowed: false; status: 403; message: string } {
  if (resourceOwnerId == null) {
    return { allowed: true }
  }
  if (resourceOwnerId !== sessionUserId) {
    return { allowed: false, status: 403, message: 'Kein Zugriff auf diese Ressource.' }
  }
  return { allowed: true }
}
