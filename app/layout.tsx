import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Suspense } from "react"
import { AgeGate } from "@/components/age-gate"
import { Toaster } from "@/components/ui/toaster"
import { ReferralCapture } from "@/components/referral-capture"
import { BrandingProvider } from "@/components/branding-provider"
import DecorativeBackground from "@/components/decorative-background"
import { DecorativeProductBackground } from "@/components/decorative-product-background"
import { ConsentBanner } from "@/components/consent/ConsentBanner"
import { PwaRegister } from "@/components/pwa-register"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Premium Headshop - Exklusives Kiffer-Zubehör",
  description: "Hochwertige Bongs, Grinder, Papers und mehr. Store-Eigene Produkte & Influencer-Editionen.",
  keywords: ["Premium Headshop", "Bongs", "Grinder", "Cannabis Zubehör", "Vaporizer", "Influencer"],
  manifest: "/manifest.json",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="theme-light theme-chillmart">
      <body className={`${inter.className} theme-chillmart min-h-screen overflow-x-hidden`}>
        <DecorativeBackground />
        <DecorativeProductBackground />
        <main className="storefront-main relative z-10 min-h-screen bg-chill-bg">
          <BrandingProvider>
            <Suspense fallback={null}>
              <ReferralCapture />
            </Suspense>
            <PwaRegister />
            <AgeGate />
            {children}
            <ConsentBanner />
            <Toaster />
          </BrandingProvider>
        </main>
      </body>
    </html>
  )
}
