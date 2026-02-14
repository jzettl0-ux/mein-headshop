/**
 * Core Type Definitions for Mein Headshop
 */

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
      }
      influencers: {
        Row: Influencer
        Insert: Omit<Influencer, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Influencer, 'id' | 'created_at'>>
      }
      orders: {
        Row: Order
        Insert: {
          order_number: string
          user_id?: string | null
          customer_email: string
          customer_name: string
          shipping_address: Record<string, unknown>
          billing_address: Record<string, unknown>
          subtotal: number
          shipping_cost: number
          total: number
          status?: string
          has_adult_items?: boolean
          payment_method?: string | null
          payment_status?: string
          discount_code?: string | null
          discount_amount?: number
        }
        Update: Partial<Omit<Order, 'id' | 'created_at'>> 
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id' | 'created_at'>
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>
      }
      site_settings: {
        Row: { key: string; value: string }
        Insert: { key: string; value: string }
        Update: { value: string }
      }
      discount_codes: {
        Row: DiscountCode
        Insert: Omit<DiscountCode, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DiscountCode, 'id'>> 
      }
      product_ratings: {
        Row: { id: string; product_id: string; user_id: string; rating: number; created_at: string }
        Insert: { product_id: string; user_id: string; rating: number }
        Update: { rating: number }
      }
    }
  }
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  image_url: string
  images: string[] // Multiple images
  category: ProductCategory
  stock: number
  is_adult_only: boolean // 18+ Produkt
  is_featured: boolean
  influencer_id?: string
  tags: string[]
  created_at: string
  updated_at: string
  /** Prozent-Rabatt (0–100), optional mit discount_until */
  discount_percent?: number
  discount_until?: string | null
  /** Einkaufspreis (nur intern, für Marge/Break-even) */
  cost_price?: number | null
  total_sold?: number
  average_rating?: number
  rating_count?: number
}

export interface DiscountCode {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  min_order_amount: number | null
  max_uses: number | null
  used_count: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ProductCategory = 
  | 'bongs'
  | 'grinder'
  | 'papers'
  | 'vaporizer'
  | 'zubehoer'
  | 'influencer-drops'

export interface Influencer {
  id: string
  name: string
  slug: string
  bio: string
  avatar_url: string
  banner_url: string
  social_links: {
    instagram?: string
    tiktok?: string
    youtube?: string
    twitter?: string
  }
  accent_color: string // Gold oder Neon
  is_active: boolean
  /** Auf der Startseite anzeigen */
  show_on_homepage?: boolean
  /** Reihenfolge auf der Startseite */
  homepage_order?: number
  /** Optional: eigener Titel nur für die Startseiten-Karte */
  homepage_title?: string | null
  /** Optional: eigener Bio-Text nur für die Startseiten-Karte */
  homepage_bio?: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  user_id?: string
  customer_email: string
  customer_name: string
  shipping_address: ShippingAddress
  billing_address: ShippingAddress
  items: OrderItem[]
  subtotal: number
  shipping_cost: number
  total: number
  status: OrderStatus
  has_adult_items: boolean
  payment_method: string
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
  discount_code?: string | null
  discount_amount?: number
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image: string
  quantity: number
  price: number
  total: number
  created_at: string
}

export interface ShippingAddress {
  first_name: string
  last_name: string
  street: string
  house_number: string
  postal_code: string
  city: string
  country: string
  phone: string
}

export type OrderStatus = 
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'

export interface CartItem {
  product: Product
  quantity: number
}

export interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getSubtotal: () => number
  getShipping: () => number
  hasAdultItems: () => boolean
}

export interface FilterOptions {
  category?: ProductCategory
  influencerId?: string
  minPrice?: number
  maxPrice?: number
  isAdultOnly?: boolean
  isFeatured?: boolean
  search?: string
}
