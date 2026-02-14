import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartState, CartItem, Product } from '@/lib/types'
import { calculateShipping, getEffectivePrice } from '@/lib/utils'

/**
 * Warenkorb Store mit Zustand
 * Persistiert automatisch in LocalStorage
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id
          )

          if (existingItem) {
            // Update quantity if item already exists
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          }

          // Add new item
          return {
            items: [...state.items, { product, quantity }],
          }
        })
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }))
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      getSubtotal: () => {
        const { items } = get()
        return items.reduce(
          (total, item) => total + getEffectivePrice(item.product) * item.quantity,
          0
        )
      },

      getShipping: () => {
        const { items } = get()
        return calculateShipping(items.map(item => item.product))
      },

      getTotal: () => {
        const { getSubtotal, getShipping } = get()
        return getSubtotal() + getShipping()
      },

      hasAdultItems: () => {
        const { items } = get()
        return items.some((item) => item.product.is_adult_only)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
