'use client'

import { useEffect, useRef } from 'react'
import { useCartStore } from '@/store/cart'
import { getCurrentUser } from '@/lib/supabase/auth'
import type { CartItem } from '@/lib/types'

/**
 * Cart-Merge bei Login: Nach Login aktuelle Items an Server senden (merge),
 * dann Warenkorb vom Server laden und Store ersetzen (sync).
 * Wird einmal pro Login ausgeführt.
 */
export function CartMergeSync() {
  const { items, replaceItems } = useCartStore()
  const mergedRef = useRef(false)
  const syncedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    async function run() {
      const user = await getCurrentUser()
      if (!user) {
        mergedRef.current = false
        syncedRef.current = false
        return
      }

      if (!mergedRef.current && items.length > 0) {
        mergedRef.current = true
        try {
          await fetch('/api/cart/merge', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
            }),
          })
        } catch {
          mergedRef.current = false
        }
      }

      if (!syncedRef.current) {
        syncedRef.current = true
        try {
          const res = await fetch('/api/cart/sync', { credentials: 'include' })
          const data = await res.json().catch(() => ({}))
          const list = Array.isArray(data?.items) ? data.items : []
          if (list.length > 0 && mounted) {
            const cartItems: CartItem[] = list.map((x: { product: unknown; quantity: number }) => ({
              product: x.product as CartItem['product'],
              quantity: x.quantity,
            }))
            replaceItems(cartItems)
          }
        } catch {
          syncedRef.current = false
        }
      }
    }

    run()
    return () => { mounted = false }
  }, [items.length, replaceItems])

  return null
}
