'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, Users, LogOut, Palette, TicketPercent, Calculator, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCurrentUser, signOut, onAuthStateChange } from '@/lib/supabase/auth'
import { useToast } from '@/hooks/use-toast'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setIsLoading(false)
      
      if (!currentUser) {
        router.push('/login')
      }
    }
    
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((newUser) => {
      setUser(newUser)
      if (!newUser) {
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: 'Erfolgreich abgemeldet',
        description: 'Bis bald!',
      })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        title: 'Fehler beim Abmelden',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="admin-area min-h-screen bg-luxe-black flex items-center justify-center">
        <div className="text-foreground">Laden...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Produkte', icon: Package },
    { href: '/admin/influencers', label: 'Influencer', icon: Users },
    { href: '/admin/startseite', label: 'Startseite', icon: Home },
    { href: '/admin/orders', label: 'Bestellungen', icon: Package },
    { href: '/admin/discount-codes', label: 'Rabattcodes', icon: TicketPercent },
    { href: '/admin/margin', label: 'Kostenrechner', icon: Calculator },
    { href: '/admin/settings', label: 'Branding & Farben', icon: Palette },
  ]

  return (
    <div className="admin-area min-h-screen bg-luxe-black">
      {/* Admin Header – gleiches Design wie Shop (Kiffergrün im Light-Theme) */}
      <header className="bg-luxe-charcoal border-b border-luxe-gray">
        <div className="container-luxe py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-luxe-gold to-luxe-neon rounded-lg flex items-center justify-center">
                <span className="text-luxe-black font-bold text-xl">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Premium Headshop</h1>
                <p className="text-sm text-luxe-silver">Admin-Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-foreground font-medium">{user?.email}</p>
                <p className="text-xs text-luxe-silver">Admin</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-luxe-silver hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-luxe-charcoal border-r border-luxe-gray p-6">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-luxe-silver hover:text-foreground hover:bg-luxe-gray transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content – Hintergrund wie Shop */}
        <main className="flex-1 p-8 bg-luxe-black">
          {children}
        </main>
      </div>
    </div>
  )
}
