'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Mock products - später durch echte Supabase-Daten ersetzen
const mockProducts = [
  {
    id: 'prod-001',
    name: 'Premium Glasbong "Crystal"',
    slug: 'premium-glasbong-crystal',
    price: 89.99,
    category: 'bongs',
    stock: 12,
    is_adult_only: true,
    is_featured: true,
    influencer_id: null,
    image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80',
  },
  {
    id: 'prod-005',
    name: 'Max\'s Choice - Perkolator Bong',
    slug: 'max-choice-perkolator-bong',
    price: 129.99,
    category: 'influencer-drops',
    stock: 5,
    is_adult_only: true,
    is_featured: true,
    influencer_id: 'inf-001',
    influencer_name: 'Max Grün',
    image_url: 'https://images.unsplash.com/photo-1577705998148-6da4f3d70118?w=400&q=80',
  },
]

export default function AdminProductsPage() {
  const [products, setProducts] = useState(mockProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, influencers(name)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      const productsWithInfluencer = data.map(p => ({
        ...p,
        influencer_name: (p as any).influencers?.name || null,
      }))
      setProducts(productsWithInfluencer as any)
    }
  }

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Möchtest du "${productName}" wirklich löschen?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      toast({
        title: 'Produkt gelöscht',
        description: `${productName} wurde entfernt.`,
      })

      loadProducts()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast({
        title: 'Fehler beim Löschen',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Produkte</h1>
          <p className="text-luxe-silver">
            Verwalte deine Store-Produkte und Influencer-Editionen
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Neues Produkt
        </Link>
      </div>

      {/* Search */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxe-silver" />
            <Input
              type="text"
              placeholder="Produkte durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-luxe-gray border-luxe-silver text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardContent className="py-12 text-center">
              <p className="text-luxe-silver">Keine Produkte gefunden.</p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-luxe-charcoal border-luxe-gray hover:border-luxe-gold/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-luxe-gray flex-shrink-0">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-1">
                            {product.name}
                          </h3>
                          <p className="text-luxe-silver text-sm">
                            {product.slug}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-xl">
                            {formatPrice(product.price)}
                          </div>
                          <div className="text-luxe-silver text-sm">
                            Stock: {product.stock}
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary">{product.category}</Badge>
                        {product.is_featured && (
                          <Badge variant="featured">Featured</Badge>
                        )}
                        {product.is_adult_only && (
                          <Badge variant="adult">18+</Badge>
                        )}
                        {product.influencer_id && (
                          <Badge className="bg-violet-600 text-white font-bold border-none">
                            Influencer: {product.influencer_name}
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/shop/${product.slug}`}
                          target="_blank"
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-luxe-gray hover:bg-luxe-gray/80 text-white text-sm transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          Ansehen
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-1.5" />
                          Bearbeiten
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="inline-flex items-center px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          Löschen
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Stats */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-luxe-silver">
              Gesamt: {filteredProducts.length} Produkte
            </span>
            <span className="text-luxe-silver">
              Store-Eigen: {filteredProducts.filter(p => !p.influencer_id).length} | 
              Influencer: {filteredProducts.filter(p => p.influencer_id).length}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
