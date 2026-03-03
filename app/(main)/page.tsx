import dynamic from 'next/dynamic'
import { HeroSection } from '@/components/sections/hero-section'
import { PromoStrip } from '@/components/sections/promo-strip'
import { QuickCategoryLinks } from '@/components/sections/quick-category-links'
import { FeaturedProducts } from '@/components/sections/featured-products'
import { BestsellerSection } from '@/components/sections/bestseller-section'

const LightningDealsSection = dynamic(
  () => import('@/components/sections/lightning-deals-section').then((m) => ({ default: m.LightningDealsSection })),
  { ssr: false }
)
const VaultDropsSection = dynamic(
  () => import('@/components/sections/vault-drops-section').then((m) => ({ default: m.VaultDropsSection })),
  { ssr: false }
)
import { CategoryShowcase } from '@/components/sections/category-showcase'
import { TrustBanner } from '@/components/sections/trust-banner'
import { InfluencerGrid } from '@/components/sections/influencer-grid'
import { TestimonialsSection } from '@/components/sections/testimonials-section'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PromoStrip />
      <QuickCategoryLinks />
      <FeaturedProducts />
      <LightningDealsSection />
      <VaultDropsSection />
      <BestsellerSection />
      <TrustBanner />
      <CategoryShowcase />
      <InfluencerGrid />
      <TestimonialsSection />
    </>
  )
}
