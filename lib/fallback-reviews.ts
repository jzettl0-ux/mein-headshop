/**
 * Beispiel-Kundenstimmen für Kundenbewertungen und Testimonials.
 * Werden angezeigt, wenn noch wenige/keine echten Bewertungen vorhanden sind.
 */

export interface FallbackReview {
  id: string
  rating: number
  comment: string
  display_name: string
  source: 'customer'
  created_at: string
}

/** Synthetische Beispiel-Bewertungen – sehen aus wie echte Kundenstimmen */
export const FALLBACK_SHOP_REVIEWS: FallbackReview[] = [
  {
    id: 'fallback-1',
    rating: 5,
    comment: 'Schnelle Lieferung, diskret verpackt. Genau was ich mir vorgestellt habe – werde wieder bestellen.',
    display_name: 'Tom M.',
    source: 'customer',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-2',
    rating: 5,
    comment: 'Endlich ein Shop mit Qualität und guter Beratung. Die Influencer-Kollektion ist richtig gut getroffen.',
    display_name: 'Sarah K.',
    source: 'customer',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'fallback-3',
    rating: 5,
    comment: 'Unkompliziert von der Bestellung bis zur Lieferung. Top Produkte, fairer Preis.',
    display_name: 'Lukas P.',
    source: 'customer',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
]
