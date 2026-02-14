import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { DecorativeProductBackground } from "@/components/decorative-product-background"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DecorativeProductBackground />
      <Header />
      <main className="relative z-10 min-h-screen pt-20">
        {children}
      </main>
      <Footer />
    </>
  )
}
