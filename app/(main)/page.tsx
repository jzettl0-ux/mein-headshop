import { HeroSection } from '@/components/sections/hero-section'
import { FeaturedProducts } from '@/components/sections/featured-products'
import { BestsellerSection } from '@/components/sections/bestseller-section'
import { InfluencerGrid } from '@/components/sections/influencer-grid'
import { CategoryShowcase } from '@/components/sections/category-showcase'
import { TrustBanner } from '@/components/sections/trust-banner'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedProducts />
      <BestsellerSection />
      <CategoryShowcase />
      <InfluencerGrid />
      <TrustBanner />
    </>
  )
}
