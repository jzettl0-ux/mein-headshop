const STORAGE_KEY = 'recently-viewed'
const MAX_ITEMS = 6

export type RecentlyViewedItem = {
  id: string
  slug: string
  name: string
  image: string | null
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x): x is RecentlyViewedItem => x && typeof x.id === 'string' && typeof x.slug === 'string' && typeof x.name === 'string')
      .slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

export function addRecentlyViewed(product: { id: string; slug: string; name: string; image_url?: string | null; images?: string[] | null }): void {
  if (typeof window === 'undefined') return
  try {
    const image = product.images?.[0] ?? product.image_url ?? null
    const item: RecentlyViewedItem = { id: product.id, slug: product.slug, name: product.name, image }
    let list = getRecentlyViewed()
    list = list.filter((x) => x.id !== product.id)
    list.unshift(item)
    list = list.slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}
