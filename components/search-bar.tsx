'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  image_url: string
  category: string
}

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const searchProducts = async () => {
      setIsLoading(true)
      
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, image_url, category')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(6)

      setResults(data || [])
      setIsLoading(false)
    }

    const debounce = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSelect = (slug: string) => {
    setIsOpen(false)
    setQuery('')
    router.push(`/shop/${slug}`)
  }

  return (
    <div ref={searchRef} className="relative">
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-md text-luxe-silver hover:text-white hover:bg-accent transition-colors flex items-center justify-center"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Search Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
            >
              <div className="bg-luxe-charcoal border border-luxe-gray rounded-xl shadow-2xl overflow-hidden">
                {/* Input */}
                <div className="p-4 border-b border-luxe-gray">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxe-silver" />
                    <Input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Produkte durchsuchen..."
                      className="pl-12 pr-12 bg-luxe-gray border-luxe-silver text-white"
                      autoFocus
                    />
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-luxe-silver hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center text-luxe-silver">
                      Suche...
                    </div>
                  ) : results.length === 0 && query.length >= 2 ? (
                    <div className="p-8 text-center text-luxe-silver">
                      Keine Produkte gefunden
                    </div>
                  ) : results.length > 0 ? (
                    <div className="p-2">
                      {results.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleSelect(product.slug)}
                          className="w-full p-3 hover:bg-luxe-gray rounded-lg transition-colors flex items-center space-x-4 text-left"
                        >
                          <div className="w-16 h-16 bg-luxe-gray rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold truncate">
                              {product.name}
                            </p>
                            <p className="text-luxe-silver text-sm">
                              {product.category}
                            </p>
                          </div>
                          <div className="text-luxe-gold font-bold">
                            {formatPrice(product.price)}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-luxe-silver">
                      Starte die Suche mit mindestens 2 Zeichen
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
