import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ReferralCapture } from '@/components/referral-capture'
import { AffiliateCapture } from '@/components/affiliate-capture'
import { CartMergeSync } from '@/components/cart-merge-sync'
import { getCompanyInfoAsync, getSupportHoursAsync, getSiteUrlAsync } from '@/lib/company'
import { OrganizationJsonLd } from '@/components/organization-json-ld'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [company, supportHours, siteUrl] = await Promise.all([getCompanyInfoAsync(), getSupportHoursAsync(), getSiteUrlAsync()])
  return (
    <>
      <OrganizationJsonLd company={company} baseUrl={siteUrl} />
      <Suspense fallback={null}>
        <ReferralCapture />
        <AffiliateCapture />
        <CartMergeSync />
      </Suspense>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-chill-green focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-chill-green"
      >
        Zum Inhalt springen
      </a>
      <Header />
      <main id="main-content" className="storefront-main relative z-10 min-h-screen bg-chill-bg pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:pt-[calc(5rem+env(safe-area-inset-top,0px))] pb-safe" role="main" tabIndex={-1}>
        {children}
      </main>
      <Footer company={company} supportHours={supportHours} />
    </>
  )
}
