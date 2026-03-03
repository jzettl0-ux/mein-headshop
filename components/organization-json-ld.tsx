import type { CompanyInfo } from '@/lib/company'

export function OrganizationJsonLd({ company, baseUrl }: { company: CompanyInfo; baseUrl?: string }) {
  const url = baseUrl || ''
  if (!url) return null
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    url,
    logo: `${url}/icon-512.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: company.email,
      ...(company.phone && { telephone: company.phone }),
      contactType: 'customer service',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.address,
      postalCode: company.postalCode,
      addressLocality: company.city,
      addressCountry: company.country,
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
