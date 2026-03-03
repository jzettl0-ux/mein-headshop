import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="storefront-main min-h-screen pt-20 bg-chill-bg">
        {children}
      </main>
      <Footer />
    </>
  )
}
