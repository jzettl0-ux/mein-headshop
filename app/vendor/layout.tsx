'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, Store, LogOut, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { getCurrentUser, signOut, onAuthStateChange } from '@/lib/supabase/auth'
import { useToast } from '@/hooks/use-toast'

const NAV = [
  { href: '/vendor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/orders', label: 'Bestellungen', icon: Package },
  { href: '/vendor/offers', label: 'Angebote', icon: Store },
  { href: '/vendor/account', label: 'Konto', icon: User },
] as const

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const [vendor, setVendor] = useState<{ id: string; company_name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [noAccess, setNoAccess] = useState(false)
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const { toast } = useToast()

  useEffect(() => {
    const check = async () => {
      const user = await getCurrentUser()
      if (!user) {
        setLoading(false)
        router.push('/auth?redirect=/vendor')
        return
      }
      const res = await fetch('/api/vendor/context')
      const data = await res.json().catch(() => ({}))
      if (!data.isVendor || !data.vendor) {
        setNoAccess(true)
        setVendor(null)
      } else {
        setVendor(data.vendor)
      }
      setLoading(false)
    }
    check()

    const { data: { subscription } } = onAuthStateChange((u) => {
      if (!u) router.push('/auth?redirect=/vendor')
    })
    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await signOut()
    toast({ title: 'Abgemeldet' })
    router.push('/auth?redirect=/vendor')
  }

  if (loading) {
    return (
      <div className="vendor-portal min-h-screen flex items-center justify-center bg-luxe-black">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  if (noAccess) {
    return (
      <div className="vendor-portal min-h-screen flex items-center justify-center p-6 bg-luxe-black">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold text-white">Kein Vendor-Zugriff</h1>
          <p className="text-luxe-silver">
            Dein Konto ist noch nicht als Verkäufer freigeschaltet oder die KYB-Prüfung ist noch ausstehend.
          </p>
          <p className="text-sm text-luxe-silver">
            Kontaktiere uns unter support@premium-headshop.de für weitere Informationen.
          </p>
          <Button variant="luxe" onClick={handleLogout}>Abmelden</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="vendor-portal min-h-screen bg-luxe-black">
      <header className="bg-luxe-charcoal border-b border-luxe-gray">
        <div className="container-luxe py-4">
          <div className="flex items-center justify-between">
            <Link href="/vendor" className="flex items-center gap-3">
              <Logo showText={false} size="md" />
              <div>
                <h1 className="text-lg font-bold text-white">Vendor-Portal</h1>
                {vendor && <p className="text-xs text-luxe-silver">{vendor.company_name}</p>}
              </div>
            </Link>
            <Button variant="admin-outline" size="sm" onClick={handleLogout} className="text-luxe-gold">
              <LogOut className="w-4 h-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-56 shrink-0 border-r border-luxe-gray bg-luxe-charcoal/95 min-h-[calc(100vh-4.5rem)]">
          <nav className="p-4 space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const isActive = href === '/vendor' ? pathname === '/vendor' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    isActive ? 'bg-luxe-gold/20 text-luxe-gold' : 'text-luxe-silver hover:bg-luxe-gray/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
