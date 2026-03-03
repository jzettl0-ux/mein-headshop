'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Menu, X, User, LogOut, UserCircle, Heart, Trash2, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/search-bar'
import { Logo } from '@/components/logo'
import { getCurrentUser, onAuthStateChange, signOut } from '@/lib/supabase/auth'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loyaltySummary, setLoyaltySummary] = useState<{ points_balance: number; tier: string } | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const cartDropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    getCurrentUser().then((u) => setUser(u ?? null))
    const { data: { subscription } } = onAuthStateChange((u) => setUser(u ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user?.id) {
      setLoyaltySummary(null)
      return
    }
    fetch('/api/account/loyalty', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.enabled !== false && d != null) {
          setLoyaltySummary({ points_balance: d.points_balance ?? 0, tier: d.tier ?? 'bronze' })
        } else {
          setLoyaltySummary(null)
        }
      })
      .catch(() => setLoyaltySummary(null))
  }, [user?.id])

  useEffect(() => {
    if (!userMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  useEffect(() => {
    if (!cartDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (cartDropdownRef.current && !cartDropdownRef.current.contains(e.target as Node)) {
        setCartDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [cartDropdownOpen])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await signOut()
    router.push('/')
  }

  const cartItemsCount = items.reduce((total, item) => total + item.quantity, 0)
  const wishlistCount = useWishlistStore((s) => s.productIds.length)

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/influencer', label: 'Influencer' },
    { href: '/about', label: 'Über Uns' },
  ]

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          'site-header fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="container-luxe pt-safe">
          <div className="flex items-center justify-between h-14 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center group touch-target min-w-0">
              <Logo showText={true} size="md" className="group-hover:opacity-90 transition-opacity shrink-0" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-chill-dark-muted hover:text-chill-dark transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-chill-green group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            {/* Actions – Touch-Ziele min. 44px auf Mobile */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:block">
                <SearchBar />
              </div>
              {/* User: Anmeldestatus + Dropdown (Profil / Abmelden) */}
              <div className="hidden sm:block relative" ref={userMenuRef}>
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((o) => !o)}
                      className="inline-flex touch-target items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-chill-dark-muted hover:text-chill-dark hover:bg-gray-100 transition-colors min-w-[44px]"
                      title="Konto & Abmelden"
                      aria-expanded={userMenuOpen}
                      aria-haspopup="true"
                    >
                      <span className="relative">
                        <User className="w-5 h-5" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-chill-green rounded-full ring-2 ring-white" title="Angemeldet" aria-hidden />
                      </span>
                      <span className="max-w-[100px] truncate text-sm text-chill-dark-muted">
                        {user.email?.split('@')[0] || 'Profil'}
                      </span>
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-100 bg-white shadow-lg shadow-gray-200/50 py-2 z-50"
                        >
                          <div className="px-3 py-2 border-b border-gray-100">
                            <p className="text-xs text-chill-dark-muted">Angemeldet als</p>
                            <p className="text-sm font-medium text-chill-dark truncate" title={user.email}>{user.email}</p>
                          </div>
                          <Link
                            href="/account"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2.5 text-sm text-chill-dark hover:bg-gray-50 transition-colors"
                          >
                            <UserCircle className="w-4 h-4 text-chill-green" />
                            Mein Profil
                          </Link>
                          <Link
                            href="/account/loyalty"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2.5 text-sm text-chill-dark hover:bg-gray-50 transition-colors"
                          >
                            <Gift className="w-4 h-4 text-chill-green" />
                            Punkte & Belohnungen
                            {loyaltySummary != null && loyaltySummary.points_balance > 0 && (
                              <span className="ml-auto text-chill-green font-semibold tabular-nums">
                                {loyaltySummary.points_balance.toLocaleString('de-DE')} Punkte
                              </span>
                            )}
                          </Link>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-chill-dark-muted hover:bg-gray-50 hover:text-red-500 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Abmelden
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    href="/auth"
                    className="inline-flex touch-target items-center justify-center rounded-md text-chill-dark-muted hover:text-chill-dark hover:bg-gray-100 transition-colors"
                    title="Anmelden"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                )}
              </div>
              <Link
                href="/wishlist"
                className="relative inline-flex touch-target items-center justify-center rounded-md text-chill-dark-muted hover:text-chill-dark hover:bg-gray-100 transition-colors"
                title="Wunschliste"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 sm:top-0 sm:right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>
              <div className="relative" ref={cartDropdownRef}>
                {cartItemsCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCartDropdownOpen((o) => !o)}
                    className="relative inline-flex touch-target items-center justify-center rounded-md text-chill-dark-muted hover:text-chill-dark hover:bg-gray-100 transition-colors"
                    title="Warenkorb"
                    aria-expanded={cartDropdownOpen}
                    aria-haspopup="true"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="absolute top-0.5 right-0.5 sm:top-0 sm:right-0 w-5 h-5 bg-chill-green text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/cart"
                    className="relative inline-flex touch-target items-center justify-center rounded-md text-chill-dark-muted hover:text-chill-dark hover:bg-gray-100 transition-colors"
                    title="Warenkorb"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </Link>
                )}
                <AnimatePresence>
                  {cartDropdownOpen && items.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 w-72 max-h-[70vh] overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg shadow-gray-200/50 z-50 flex flex-col"
                    >
                      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-medium text-chill-dark">Warenkorb</span>
                        <span className="text-xs text-chill-dark-muted">{cartItemsCount} {cartItemsCount === 1 ? 'Artikel' : 'Artikel'}</span>
                      </div>
                      <div className="overflow-y-auto py-2 max-h-56">
                        {items.map((item) => (
                          <div
                            key={item.product.id}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 group"
                          >
                            <span className="flex-1 min-w-0 text-sm text-chill-dark truncate" title={item.product.name}>
                              {item.product.name}
                            </span>
                            <span className="text-xs text-chill-dark-muted shrink-0">×{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.product.id)}
                              className="p-1.5 rounded text-chill-dark-muted hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                              title="Aus Warenkorb entfernen"
                              aria-label={`${item.product.name} entfernen`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 border-t border-gray-100">
                        <Link
                          href="/cart"
                          onClick={() => setCartDropdownOpen(false)}
                          className="block w-full text-center py-2.5 rounded-lg bg-chill-green text-white font-semibold text-sm hover:bg-chill-green-hover transition-colors"
                        >
                          Zum Warenkorb
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden touch-target text-chill-dark-muted hover:text-chill-dark -mr-1"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-white backdrop-blur-lg pt-safe pb-safe flex flex-col overflow-y-auto border-l border-gray-100">
              <nav className="flex flex-col px-6 py-8 space-y-1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-4 text-xl font-semibold text-chill-dark hover:text-chill-green transition-colors touch-target rounded-lg active:bg-gray-50 border-b border-gray-100"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: navLinks.length * 0.06 }}
                    className="w-full max-w-xs space-y-2 pt-4 border-t border-gray-100"
                  >
                    <p className="text-center text-xs text-chill-dark-muted">Angemeldet als</p>
                    <p className="text-center text-sm font-medium text-chill-dark truncate px-4">{user.email}</p>
                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 min-h-[48px] rounded-lg px-6 text-chill-dark hover:bg-gray-50 transition-colors touch-target"
                    >
                      <UserCircle className="w-5 h-5 text-chill-green" />
                      Mein Profil
                    </Link>
                    <Link
                      href="/account/loyalty"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 min-h-[48px] rounded-lg px-6 text-chill-dark hover:bg-gray-50 transition-colors touch-target"
                    >
                      <Gift className="w-5 h-5 text-chill-green" />
                      Punkte & Belohnungen
                      {loyaltySummary != null && loyaltySummary.points_balance > 0 && (
                        <span className="text-chill-green font-semibold tabular-nums">
                          ({loyaltySummary.points_balance.toLocaleString('de-DE')} Punkte)
                        </span>
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        handleLogout()
                      }}
                      className="flex w-full items-center justify-center gap-2 min-h-[48px] rounded-lg px-6 text-chill-dark-muted hover:text-red-500 hover:bg-red-50 transition-colors touch-target"
                    >
                      <LogOut className="w-5 h-5" />
                      Abmelden
                    </button>
                  </motion.div>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
