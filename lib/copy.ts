/**
 * Kiffertypische Sprüche & Dankestexte – professionell, zum Schmunzeln.
 * Werden z. B. im Kundenkonto, Footer, Bestellbestätigung eingeblendet.
 */
export const DANKESPRUECHE = [
  'Ohne dich wären unsere Regale voll. Danke fürs Leeren – im besten Sinne!',
  'Du hast ausgegeben, wir haben geliefert – Win-Win. Danke!',
  'Wer so viel bestellt, weiß, was gut ist. Wir danken!',
  'Jede Bestellung ein kleines Fest. Danke, dass wir dabei sein durften.',
  'Qualität braucht Abnehmer wie dich. Danke!',
  'Lieferung pünktlich, Session entspannt. Danke, dass du dabei bist!',
  'Dein zukünftiges Ich bei der nächsten Session wird sich freuen. Danke!',
  'Danke, dass du dein Geld in Qualität statt in Quatsch investierst.',
  'Von Kennern für Genießer – und du gehörst dazu. Danke!',
] as const

export function getRandomSpruch(): string {
  return DANKESPRUECHE[Math.floor(Math.random() * DANKESPRUECHE.length)]
}

/** Einen Spruch stabil pro User/Session (z. B. anhand User-ID oder Tag) wählen, damit er nicht bei jedem Reload wechselt. */
export function getStableSpruch(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % DANKESPRUECHE.length
  return DANKESPRUECHE[index]
}
