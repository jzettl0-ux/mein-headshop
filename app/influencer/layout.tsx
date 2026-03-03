'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Tag, Banknote, LogOut, Image } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { Button } from '@/components/ui/button'

export default function InfluencerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const [loading, setLoading] = useState(true)
  const [isInfluencer, setIsInfluencer] = useState(false)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      const user = await getCurrentUser()
      if (!user && mounted) {
        router.replace(`/auth?redirect=${encodeURIComponent(pathname || '/influencer/dashboard')}`)
        setLoading(false)
        return
      }
      if (!user) {
        setLoading(false)
        return
      }
      const res = await fetch('/api/influencer/stats')
      if (res.status === 403 && mounted) {
        router.replace('/account')
        setIsInfluencer(false)
      } else if (res.ok) {
        setIsInfluencer(true)
      }
      if (mounted) setLoading(false)
    }
    check()
    return () => { mounted = false }
  }, [router, pathname])

  const handleLogout = async () => {
    const { signOut } = await import('@/lib/supabase/auth')
    await signOut()
    router.replace('/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse rounded-xl bg-stone-200 h-12 w-48" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50/80">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/influencer/dashboard" className="font-semibold text-stone-900">
              Partner-Dashboard
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/influencer/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/influencer/dashboard'
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Übersicht
                </span>
              </Link>
              <Link
                href="/influencer/dashboard#code"
                className="px-3 py-2 rounded-md text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-2"
              >
                <Tag className="h-4 w-4" /> Mein Code
              </Link>
              <Link
                href="/influencer/dashboard#payouts"
                className="px-3 py-2 rounded-md text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-2"
              >
                <Banknote className="h-4 w-4" /> Auszahlungen
              </Link>
              <Link
                href="/influencer/assets"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  pathname === '/influencer/assets'
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Image className="h-4 w-4" /> Mediathek
              </Link>
            </nav>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-stone-600">
            <LogOut className="h-4 w-4 mr-2" /> Abmelden
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
