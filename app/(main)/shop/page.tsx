'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Filter } from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import { ProductCardSkeleton } from '@/components/shop/product-card-skeleton'
import { VoucherBadges } from '@/components/shop/voucher-badges'
import { ProductFilters } from '@/components/shop/product-filters'
import { FacetFilters } from '@/components/shop/facet-filters'
import { HighlightsExplainer } from '@/components/sections/highlights-explainer'
import { RecentlyViewed } from '@/components/recently-viewed'
import { ShopBreadcrumbs } from '@/components/shop-breadcrumbs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Product } from '@/lib/types'
import { supabase } from '@/lib/supabase'

function parseCategory(value: string | null): string | null {
  if (!value) return null
  return value.toLowerCase().trim() || null
}

export default function ShopPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const categoryFromUrl = useMemo(() => parseCategory(searchParams.get('category')), [searchParams])
  const subcategoryFromUrl = useMemo(() => searchParams.get('subcategory')?.trim().toLowerCase() || null, [searchParams])
  const brandFromUrl = useMemo(() => searchParams.get('brand')?.trim() || null, [searchParams])
  const ecoFromUrl = useMemo(() => searchParams.get('eco') === '1', [searchParams])

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  const [subcategories, setSubcategories] = useState<{ slug: string; name: string }[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState(() => ({
    category: categoryFromUrl,
    subcategory: subcategoryFromUrl as string | null,
    brand: brandFromUrl as string | null,
    minPrice: 0,
    maxPrice: 1000,
    isAdultOnly: undefined as boolean | undefined,
    ecoOnly: searchParams.get('eco') === '1',
    search: '',
  }))
  const [ecoProductIds, setEcoProductIds] = useState<Set<string>>(new Set())
  const [loyaltyGated, setLoyaltyGated] = useState<{ slug: string; min_tier: number }[]>([])
  const [userTierId, setUserTierId] = useState(1)
  const [facetFilters, setFacetFilters] = useState<Record<string, string[]>>(() => {
    const out: Record<string, string[]> = {}
    searchParams.forEach((val, key) => {
      if (key.startsWith('facet_')) {
        const k = key.slice(6)
        if (val) out[k] = val.split(',').filter(Boolean)
      }
    })
    return out
  })

  useEffect(() => {
    fetch('/api/shop/loyalty-gated-categories')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setLoyaltyGated(Array.isArray(d) ? d : []))
      .catch(() => setLoyaltyGated([]))
  }, [])
  useEffect(() => {
    fetch('/api/account/loyalty', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.tier) {
          const id = d.tier === 'gold' ? 3 : d.tier === 'silver' ? 2 : 1
          setUserTierId(id)
        }
      })
      .catch(() => {})
  }, [])

  const visibleCategories = useMemo(() => {
    const all = categories
    if (loyaltyGated.length === 0) return all
    return all.filter((c) => {
      const gated = loyaltyGated.find((g) => g.slug === c.value)
      if (!gated) return true
      return userTierId >= gated.min_tier
    })
  }, [categories, loyaltyGated, userTierId])

  const hiddenCategorySlugs = useMemo(() => {
    return loyaltyGated.filter((g) => userTierId < g.min_tier).map((g) => g.slug)
  }, [loyaltyGated, userTierId])

  // URL-Parameter ?category= / ?subcategory= / ?brand= / ?eco=1 mit Filter synchron halten
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      ...(prev.category !== categoryFromUrl ? { category: categoryFromUrl, subcategory: null } : {}),
      ...(prev.subcategory !== subcategoryFromUrl ? { subcategory: subcategoryFromUrl } : {}),
      ...(prev.brand !== brandFromUrl ? { brand: brandFromUrl } : {}),
      ...(prev.ecoOnly !== ecoFromUrl ? { ecoOnly: ecoFromUrl } : {}),
    }))
  }, [categoryFromUrl, subcategoryFromUrl, brandFromUrl, ecoFromUrl])

  useEffect(() => {
    const next: Record<string, string[]> = {}
    searchParams.forEach((val, key) => {
      if (key.startsWith('facet_') && val) {
        next[key.slice(6)] = val.split(',').filter(Boolean)
      }
    })
    setFacetFilters((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
  }, [searchParams])

  useEffect(() => {
    fetch('/api/shop/eco-product-ids')
      .then((r) => (r.ok ? r.json() : { productIds: [] }))
      .then((d) => setEcoProductIds(new Set(d.productIds ?? [])))
      .catch(() => setEcoProductIds(new Set()))
  }, [])

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data.map((c: { slug: string; name: string }) => ({ value: c.slug, label: c.name })))
        }
      })
      .catch(() => {})
  }, [])

  // Subkategorien laden, wenn Kategorie gewählt
  useEffect(() => {
    if (!filters.category) {
      setSubcategories([])
      return
    }
    fetch(`/api/subcategories?parent=${encodeURIComponent(filters.category)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSubcategories(Array.isArray(data) ? data.map((s: { slug: string; name: string }) => ({ slug: s.slug, name: s.name })) : []))
      .catch(() => setSubcategories([]))
  }, [filters.category])

  const updateFiltersAndUrl = (next: typeof filters) => {
    setFilters(next)
    const params = new URLSearchParams()
    if (next.category) params.set('category', next.category)
    if (next.subcategory) params.set('subcategory', next.subcategory)
    if (next.brand) params.set('brand', next.brand)
    if (next.ecoOnly) params.set('eco', '1')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const updateFacetsAndUrl = (next: Record<string, string[]>) => {
    setFacetFilters(next)
    const params = new URLSearchParams(searchParams.toString())
    Array.from(params.keys()).filter((k) => k.startsWith('facet_')).forEach((k) => params.delete(k))
    Object.entries(next).forEach(([k, arr]) => {
      if (arr?.length) params.set(`facet_${k}`, arr.join(','))
    })
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('total_sold', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      setProducts(data as Product[])
      setFilteredProducts(data as Product[])
    } else {
      // Zeige Fehler-State statt Mock-Daten
      setProducts([])
      setFilteredProducts([])
    }
    setIsLoading(false)
  }

  const brandsFromProducts = useMemo(() => {
    const set = new Set<string>()
    products.forEach(p => { if (p.brand?.trim()) set.add(p.brand.trim()) })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [products])

  useEffect(() => {
    let filtered = [...products]

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category)
    }

    if (filters.subcategory) {
      filtered = filtered.filter(p => (p as Product & { subcategory_slug?: string | null }).subcategory_slug === filters.subcategory)
    }

    if (filters.brand) {
      filtered = filtered.filter(p => p.brand?.trim() === filters.brand)
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

    if (filters.ecoOnly) {
      filtered = filtered.filter(p => ecoProductIds.has(p.id))
    }

    Object.entries(facetFilters).forEach(([key, values]) => {
      if (!values?.length) return
      if (key === 'brand') {
        filtered = filtered.filter(p => p.brand && values.includes(p.brand.trim()))
      } else {
        filtered = filtered.filter(p => {
          const tags = (p as Product & { tags?: string[] }).tags ?? []
          return values.some(v => tags.includes(v))
        })
      }
    })

    if (hiddenCategorySlugs.length > 0) {
      filtered = filtered.filter(p => !hiddenCategorySlugs.includes(p.category))
    }

    setFilteredProducts(filtered)
  }, [filters, products, ecoProductIds, hiddenCategorySlugs, facetFilters])

  return (
    <div className="min-h-screen bg-luxe-black">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-luxe-charcoal to-luxe-black py-10 sm:py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(212,175,55,0.08)_0%,transparent_50%)]" />
        <div className="container-luxe relative z-10 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center space-y-3 sm:space-y-4"
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-gradient-flow">
              Shop
            </h1>
            <p className="text-luxe-silver text-sm sm:text-lg max-w-2xl mx-auto px-1">
              Entdecke unsere komplette Auswahl an Premium Cannabis Zubehör
            </p>
          </motion.div>
        </div>
      </div>

      <HighlightsExplainer />

      <div className="container-luxe py-6 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters (Desktop): sticky, Menü eigenständig scrollbar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden">
              <ProductFilters
                categories={visibleCategories}
                filters={filters}
                onFiltersChange={updateFiltersAndUrl}
                brands={brandsFromProducts}
                subcategories={subcategories}
              />
              <FacetFilters
                categorySlug={filters.category}
                selectedFacets={facetFilters}
                onFacetsChange={updateFacetsAndUrl}
              />
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="w-full min-h-[48px]"
            >
              <Filter className="mr-2 w-4 h-4" />
              Filter
            </Button>
            {showFilters && (
              <div className="mt-4 p-4 border border-luxe-gray rounded-lg bg-luxe-charcoal max-h-[70vh] overflow-y-auto">
                <ProductFilters
                  categories={visibleCategories}
                  filters={filters}
                  onFiltersChange={updateFiltersAndUrl}
                  brands={brandsFromProducts}
                  subcategories={subcategories}
                />
                <FacetFilters
                  categorySlug={filters.category}
                  selectedFacets={facetFilters}
                  onFacetsChange={updateFacetsAndUrl}
                />
              </div>
            )}
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <ShopBreadcrumbs
              items={[
                { label: 'Shop', href: '/shop' },
                ...(filters.category
                  ? [
                      {
                        label: categories.find((c) => c.value === filters.category)?.label ?? filters.category,
                        href: filters.subcategory ? `/shop?category=${filters.category}` : undefined,
                      },
                      ...(filters.subcategory
                        ? [{ label: subcategories.find((s) => s.slug === filters.subcategory)?.name ?? filters.subcategory }]
                        : []),
                    ]
                  : []),
              ]}
            />
            {/* Secret Shop: Ausgewählte Kategorie nicht zugänglich */}
            {filters.category && hiddenCategorySlugs.includes(filters.category) && (
              <div className="mb-6 p-4 rounded-lg bg-luxe-gold/10 border border-luxe-gold/30">
                <p className="text-luxe-gold font-medium mb-1">Secret Shop – Exklusiv für Treue-Mitglieder</p>
                <p className="text-luxe-silver text-sm mb-3">
                  Diese Kategorie ist nur für Silver- oder Gold-Mitglieder sichtbar. Sammle Punkte mit deinen Einkäufen oder nutze Status-Rabatte, um höhere Tiers zu erreichen.
                </p>
                <Link href="/account/loyalty" className="text-luxe-gold hover:underline font-medium text-sm">
                  Zu Punkte & Belohnungen →
                </Link>
              </div>
            )}
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <p className="text-luxe-silver">
                {filteredProducts.length} Produkt{filteredProducts.length !== 1 ? 'e' : ''} gefunden
              </p>
              <VoucherBadges category={filters.category ?? undefined} />
            </div>

            {/* Products */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                {products.length === 0 ? (
                  <>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-2xl mx-auto mb-6">
                      <p className="text-red-400 font-semibold mb-2">
                        ⚠️ Keine Produkte in der Datenbank
                      </p>
                      <p className="text-red-400/80 text-sm">
                        Bitte führe <code className="bg-luxe-black px-2 py-1 rounded">KOMPLETTES-RESET.sql</code> in Supabase aus.
                      </p>
                    </div>
                    <p className="text-luxe-silver text-lg">Die Datenbank muss initialisiert werden.</p>
                  </>
                ) : (
                  <>
                    <p className="text-white font-semibold text-lg mb-2">Keine Produkte gefunden</p>
                    <p className="text-luxe-silver max-w-md mx-auto mb-6">
                      Zu deiner Suche oder den gewählten Filtern gibt es keine Treffer. Versuche andere Kriterien oder schau dir die ganze Auswahl an.
                    </p>
                    <Button
                      variant="luxe"
                      onClick={() => updateFiltersAndUrl({ ...filters, search: '', category: null, subcategory: null, brand: null, minPrice: 0, maxPrice: 9999, isAdultOnly: undefined, ecoOnly: false })}
                    >
                      Filter zurücksetzen
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.07 } },
                  hidden: {},
                }}
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      visible: { opacity: 1, y: 0 },
                      hidden: { opacity: 0, y: 24 },
                    }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <ProductCard product={product} hasEcoCert={ecoProductIds.has(product.id)} />
                  </motion.div>
                ))}
              </motion.div>
            )}
            <RecentlyViewed />
          </div>
        </div>
      </div>
    </div>
  )
}
