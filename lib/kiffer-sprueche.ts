/**
 * Lustige Sprüche für den Shop – nach Bestellung, im Warenkorb, etc.
 * Perfekt zur Szene und zum Headshop.
 */

/** Sprüche nach erfolgreicher Bestellung / Zahlung */
export const SPRUECHE_BESTELLUNG_ERFOLG: string[] = [
  'Dein Paket macht sich auf den Weg – entspann dich schon mal!',
  'Bestellt ist bestellt. Jetzt heißt es: Tee kochen und warten.',
  'Nice! Dein Zeug ist unterwegs. Bald kannst du durchatmen.',
  'Danke! Wir packen alles liebevoll ein. Versprochen.',
  'Deine Bestellung ist raus – bald ist Feierabend im Kopf.',
  'Alles klar! Dein Grinder freut sich schon auf dich.',
  'Bestellung bestätigt. Zeit für einen Kaffee – oder du weißt schon.',
  'Danke für dein Vertrauen! Wir liefern, du chillst.',
  'Dein Paket wird mit Liebe gepackt. Echt jetzt.',
  'Order confirmed – jetzt noch kurz durchhalten.',
  'Alles unterwegs! Wir empfehlen: Snacks bereitlegen.',
  'Deine Bestellung ist in besten Händen. Bald in deinen.',
  'Danke! Bald liegt bei dir was Gutes im Briefkasten.',
  'Bestellt und bezahlt – mehr muss heute nicht.',
  'Wir haben alles notiert. Du kannst dich zurücklehnen.',
]

/** Sprüche für leeren Warenkorb (optional) */
export const SPRUECHE_WARENKORB_LEER: string[] = [
  'Dein Warenkorb ist leer – aber dein Potenzial nicht!',
  'Leer ist nur der Korb. Der Rest kommt von uns.',
  'Keine Panik: Der Shop ist voll. Einfach was Schönes aussuchen!',
  'Leerer Warenkorb = Platz für Neues. Los geht\'s!',
]

/**
 * Einen zufälligen Spruch aus der Liste holen (stabil pro "Session" via Index).
 * orderNumber kann genutzt werden, um bei gleicher Bestellung immer denselben Spruch zu zeigen.
 */
export function getRandomSpruch(
  list: string[],
  seed?: string
): string {
  if (list.length === 0) return ''
  if (seed) {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i)
      hash |= 0
    }
    const index = Math.abs(hash) % list.length
    return list[index]
  }
  return list[Math.floor(Math.random() * list.length)]
}
