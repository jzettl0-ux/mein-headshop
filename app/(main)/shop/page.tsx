'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Filter } from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import { ProductFilters } from '@/components/shop/product-filters'
import { Button } from '@/components/ui/button'
import { Product, ProductCategory } from '@/lib/types'
import { supabase } from '@/lib/supabase'

// Mock products - später durch echte Daten ersetzen
const mockProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Premium Glasbong "Crystal"',
    slug: 'premium-glasbong-crystal',
    description: 'Handgefertigte Premium-Bong aus hochwertigem Borosilikatglas',
    price: 89.99,
    image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80'],
    category: 'bongs',
    stock: 12,
    is_adult_only: true,
    is_featured: true,
    tags: ['premium', 'glas', 'handgefertigt'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    name: 'XXL Grinder Gold Edition',
    slug: 'xxl-grinder-gold',
    description: 'CNC-gefrästes Aluminium Grinder mit Kief-Fänger',
    price: 34.99,
    image_url: 'https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80'],
    category: 'grinder',
    stock: 28,
    is_adult_only: false,
    is_featured: true,
    tags: ['grinder', 'gold', 'premium'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-003',
    name: 'RAW Black King Size Papers',
    slug: 'raw-black-king-size',
    description: 'Ultradünne ungebleichte Papers',
    price: 4.99,
    image_url: 'https://images.unsplash.com/photo-1606506082871-8e1c9c3a9e5a?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1606506082871-8e1c9c3a9e5a?w=800&q=80'],
    category: 'papers',
    stock: 150,
    is_adult_only: false,
    is_featured: false,
    tags: ['papers', 'raw'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-004',
    name: 'Mighty+ Vaporizer',
    slug: 'mighty-plus-vaporizer',
    description: 'Top Vaporizer von Storz & Bickel',
    price: 349.99,
    image_url: 'https://images.unsplash.com/photo-1581922814484-e2bcd2508e31?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1581922814484-e2bcd2508e31?w=800&q=80'],
    category: 'vaporizer',
    stock: 8,
    is_adult_only: true,
    is_featured: true,
    tags: ['vaporizer', 'premium'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-005',
    name: 'Max\'s Choice - Perkolator Bong',
    slug: 'max-choice-perkolator-bong',
    description: 'Max Grün\'s persönliche Lieblingsbong mit Triple Perkolator',
    price: 129.99,
    image_url: 'https://images.unsplash.com/photo-1577705998148-6da4f3d70118?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1577705998148-6da4f3d70118?w=800&q=80'],
    category: 'influencer-drops',
    stock: 5,
    is_adult_only: true,
    is_featured: true,
    influencer_id: 'inf-001',
    tags: ['influencer', 'max-gruen', 'bong'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-006',
    name: 'Max Grün Signature Grinder',
    slug: 'max-gruen-signature-grinder',
    description: 'Custom Grinder mit Max Grün Logo in Neon-Grün',
    price: 44.99,
    image_url: 'https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80'],
    category: 'influencer-drops',
    stock: 15,
    is_adult_only: false,
    is_featured: true,
    influencer_id: 'inf-001',
    tags: ['influencer', 'max-gruen', 'grinder'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const VALID_CATEGORIES: ProductCategory[] = ['bongs', 'grinder', 'papers', 'vaporizer', 'zubehoer', 'influencer-drops']

function parseCategory(value: string | null): ProductCategory | null {
  if (!value) return null
  const v = value.toLowerCase().trim()
  return VALID_CATEGORIES.includes(v as ProductCategory) ? (v as ProductCategory) : null
}

export default function ShopPage() {
  const searchParams = useSearchParams()
  const categoryFromUrl = useMemo(() => parseCategory(searchParams.get('category')), [searchParams])

  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState(() => ({
    category: categoryFromUrl,
    minPrice: 0,
    maxPrice: 1000,
    isAdultOnly: undefined as boolean | undefined,
    search: '',
  }))

  // URL-Parameter ?category=... mit Filter synchron halten (z. B. bei Client-Navigation)
  useEffect(() => {
    setFilters((prev) => (prev.category !== categoryFromUrl ? { ...prev, category: categoryFromUrl } : prev))
  }, [categoryFromUrl])

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      console.log('✅ Produkte von Supabase geladen:', data.length)
      setProducts(data as Product[])
      setFilteredProducts(data as Product[])
    } else {
      console.error('⚠️ Keine Produkte in Datenbank! Verwende Mock-Daten.')
      console.error('Führe KOMPLETTES-RESET.sql aus!')
      // Zeige Fehler-State statt Mock-Daten
      setProducts([])
      setFilteredProducts([])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    let filtered = [...products]

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category)
    }

    if (filters.search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.description.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    filtered = filtered.filter(
      p => p.price >= filters.minPrice && p.price <= filters.maxPrice
    )

    if (filters.isAdultOnly !== undefined) {
      filtered = filtered.filter(p => p.is_adult_only === filters.isAdultOnly)
    }

    setFilteredProducts(filtered)
  }, [filters, products])

  return (
    <div className="min-h-screen bg-luxe-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-luxe-charcoal to-luxe-black py-16 md:py-24">
        <div className="container-luxe">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Shop
            </h1>
            <p className="text-luxe-silver text-lg max-w-2xl mx-auto">
              Entdecke unsere komplette Auswahl an Premium Cannabis Zubehör
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-luxe py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <ProductFilters
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="w-full"
            >
              <Filter className="mr-2 w-4 h-4" />
              Filter & Sortierung
            </Button>
            {showFilters && (
              <div className="mt-4 p-4 border border-luxe-gray rounded-lg bg-luxe-charcoal">
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
            )}
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-luxe-silver">
                {filteredProducts.length} Produkt{filteredProducts.length !== 1 ? 'e' : ''} gefunden
              </p>
            </div>

            {/* Products */}
            {isLoading ? (
              <div className="text-center py-16">
                <p className="text-luxe-silver text-lg">Produkte werden geladen...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-2xl mx-auto mb-6">
                  <p className="text-red-400 font-semibold mb-2">
                    ⚠️ Keine Produkte in der Datenbank
                  </p>
                  <p className="text-red-400/80 text-sm">
                    Bitte führe <code className="bg-luxe-black px-2 py-1 rounded">KOMPLETTES-RESET.sql</code> in Supabase aus.
                  </p>
                </div>
                <p className="text-luxe-silver text-lg">
                  Die Datenbank muss initialisiert werden.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
