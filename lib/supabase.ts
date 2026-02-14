import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Supabase Client für Client-Side Operations
 * Cookie-Options für lange Session (7 Tage), gleiche Konfiguration wie Middleware
 */
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 Tage (in Sekunden)
    },
  }
)

/**
 * Helper Functions für häufige Datenbankoperationen
 */

// ============================================
// PRODUCTS
// ============================================

export async function getProducts(filters?: {
  category?: string
  influencerId?: string
  isAdultOnly?: boolean
  isFeatured?: boolean
  search?: string
}) {
  let query = supabase
    .from('products')
    .select('*, influencers(*)')
    .order('created_at', { ascending: false })

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.influencerId) {
    query = query.eq('influencer_id', filters.influencerId)
  }

  if (filters?.isAdultOnly !== undefined) {
    query = query.eq('is_adult_only', filters.isAdultOnly)
  }

  if (filters?.isFeatured !== undefined) {
    query = query.eq('is_featured', filters.isFeatured)
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, influencers(*)')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data
}

export async function getFeaturedProducts(limit = 8) {
  const { data, error } = await supabase
    .from('products')
    .select('*, influencers(*)')
    .eq('is_featured', true)
    .limit(limit)

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }

  return data
}

// ============================================
// INFLUENCERS
// ============================================

export async function getInfluencers() {
  const { data, error } = await supabase
    .from('influencers')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching influencers:', error)
    return []
  }

  return data
}

export async function getInfluencerBySlug(slug: string) {
  const { data, error } = await supabase
    .from('influencers')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching influencer:', error)
    return null
  }

  return data
}

export async function getInfluencerProducts(influencerId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching influencer products:', error)
    return []
  }

  return data
}

// ============================================
// ORDERS
// ============================================

export async function createOrder(orderData: Database['public']['Tables']['orders']['Insert']) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single()

  if (error) {
    console.error('Error creating order:', error)
    throw error
  }

  return data
}

export async function createOrderItems(items: Database['public']['Tables']['order_items']['Insert'][]) {
  const { data, error } = await supabase
    .from('order_items')
    .insert(items)
    .select()

  if (error) {
    console.error('Error creating order items:', error)
    throw error
  }

  return data
}

export async function getOrderByNumber(orderNumber: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('order_number', orderNumber)
    .single()

  if (error) {
    console.error('Error fetching order:', error)
    return null
  }

  return data
}

// ============================================
// STORAGE (Images)
// ============================================

export async function uploadProductImage(file: File, productId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${productId}-${Date.now()}.${fileExt}`
  const filePath = `products/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading image:', uploadError)
    throw uploadError
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function uploadInfluencerImage(file: File, influencerId: string, type: 'avatar' | 'banner') {
  const fileExt = file.name.split('.').pop()
  const fileName = `${influencerId}-${type}-${Date.now()}.${fileExt}`
  const filePath = `influencers/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('influencer-images')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading image:', uploadError)
    throw uploadError
  }

  const { data: { publicUrl } } = supabase.storage
    .from('influencer-images')
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * Logo für den Shop (Header) in site-assets hochladen.
 * Überschreibt das bisherige Logo.
 */
export async function uploadSiteLogo(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
  const fileName = `logo.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(fileName, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading site logo:', uploadError)
    throw uploadError
  }

  const { data: { publicUrl } } = supabase.storage
    .from('site-assets')
    .getPublicUrl(fileName)

  return publicUrl
}
