import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Statische Routen (SEO)
  const routes = [
    '',
    '/shop',
    '/about',
    '/faq',
    '/contact',
    '/influencer',
    '/auth',
    '/cart',
    '/shipping',
    '/payment',
    '/wishlist',
    '/returns',
    '/a-z-garantie',
    '/impressum',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
}
