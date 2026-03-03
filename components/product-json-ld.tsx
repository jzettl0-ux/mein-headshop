'use client'

type Product = {
  id: string
  name: string
  description?: string | null
  image_url?: string | null
  images?: string[]
  price: number
  stock?: number | null
  slug: string
  average_rating?: number | null
  rating_count?: number | null
}

export function ProductJsonLd({ product, baseUrl }: { product: Product; baseUrl: string }) {
  const image = product.images?.[0] ?? product.image_url ?? ''
  const url = `${baseUrl}/shop/${product.slug}`
  const availability = (product.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? product.name,
    image: image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : undefined,
    sku: product.id,
    url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'EUR',
      price: Number(product.price),
      availability,
    },
    ...((product.average_rating != null && product.rating_count != null && product.rating_count > 0) && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.average_rating,
        reviewCount: product.rating_count,
      },
    }),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
