import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop | Premium Headshop',
  description: 'Bongs, Grinder, Papers, Vaporizer und Zubehör. Kategorien durchstöbern, Bestseller und Influencer-Editionen entdecken.',
  openGraph: {
    title: 'Shop | Premium Headshop',
    description: 'Bongs, Grinder, Papers, Vaporizer und Zubehör. Kategorien durchstöbern.',
  },
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
