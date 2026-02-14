'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Menu, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/search-bar'
import { Logo } from '@/components/logo'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const items = useCartStore((state) => state.items)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const cartItemsCount = items.reduce((total, item) => total + item.quantity, 0)

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
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-luxe-black/80 backdrop-blur-lg border-b border-luxe-gray/50'
            : 'bg-transparent'
        )}
      >
        <div className="container-luxe">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <Logo showText={true} size="md" className="group-hover:opacity-90 transition-opacity" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-luxe-silver hover:text-white transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-luxe-gold group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <div className="hidden sm:block">
                <SearchBar />
              </div>

              {/* Account Button */}
              <Link
                href="/auth"
                className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-md text-luxe-silver hover:text-white hover:bg-accent transition-colors"
                title="Konto"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Cart Button */}
              <Link
                href="/cart"
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-md text-luxe-silver hover:text-white hover:bg-accent transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-luxe-gold text-luxe-black text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-luxe-silver hover:text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
            <div className="absolute inset-0 bg-luxe-black/95 backdrop-blur-lg">
              <nav className="flex flex-col items-center justify-center h-full space-y-8">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-3xl font-bold text-white hover:text-luxe-gold transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navLinks.length * 0.1 }}
                  className="pt-8"
                >
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
                  >
                    Jetzt Shoppen
                  </Link>
                </motion.div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
