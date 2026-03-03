import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/lib/types'

export interface WishlistState {
  productIds: string[]
  add: (productId: string) => void
  remove: (productId: string) => void
  toggle: (productId: string) => void
  has: (productId: string) => boolean
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],

      add: (productId: string) => {
        set((state) =>
          state.productIds.includes(productId)
            ? state
            : { productIds: [...state.productIds, productId] }
        )
      },

      remove: (productId: string) => {
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        }))
      },

      toggle: (productId: string) => {
        const { has, add, remove } = get()
        if (has(productId)) remove(productId)
        else add(productId)
      },

      has: (productId: string) => get().productIds.includes(productId),
    }),
    { name: 'mein-headshop-wishlist' }
  )
)
