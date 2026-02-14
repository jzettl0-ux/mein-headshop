import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AgeGate } from "@/components/age-gate"
import { Toaster } from "@/components/ui/toaster"
import { BrandingProvider } from "@/components/branding-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Premium Headshop - Exklusives Kiffer-Zubehör",
  description: "Hochwertige Bongs, Grinder, Papers und mehr. Store-Eigene Produkte & Influencer-Editionen.",
  keywords: ["Premium Headshop", "Bongs", "Grinder", "Cannabis Zubehör", "Vaporizer", "Influencer"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="theme-light">
      <body className={inter.className}>
        <BrandingProvider>
          <AgeGate />
          {children}
          <Toaster />
        </BrandingProvider>
      </body>
    </html>
  )
}
