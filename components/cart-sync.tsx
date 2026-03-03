'use client'

import { useEffect, useRef } from 'react'
import { getCurrentUser, onAuthStateChange } from '@/lib/supabase/auth'
import { useCartStore } from '@/store/cart'
import type { CartItem, Product } from '@/lib/types'

/**
 * Cart-Merge bei Login: Nach Anmeldung aktuelle Store-Items an Server senden (merge),
 * dann Warenkorb vom Server laden und Store aktualisieren (sync).
 * Wird im Main-Layout eingebunden.
 */
export function CartSync() {
  const items = useCartStore((s) => s.items)
  const replaceItems = useCartStore((s) => s.replaceItems)
  const mergedRef = useRef(false)

  useEffect(() => {
    const handleAuth = async (user: { id: string } | null) => {
      if (!user) {
        mergedRef.current = false
        return
      }

      const payload = items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      }))

      if (payload.length > 0 && !mergedRef.current) {
        try {
          const res = await fetch('/api/cart/merge', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: payload }),
          })
          if (res.ok) mergedRef.current = true
        } catch {
          mergedRef.current = false
        }
      }

      try {
        const syncRes = await fetch('/api/cart/sync', { credentials: 'include' })
        if (!syncRes.ok) return
        const data = await syncRes.json()
        const list = data.items as Array<{ product_id: string; quantity: number; product: Product | null }>
        if (Array.isArray(list) && list.length > 0) {
          const cartItems: CartItem[] = list
            .filter((i) => i.product)
            .map((i) => ({ product: i.product!, quantity: i.quantity }))
          replaceItems(cartItems)
        }
      } catch {
        // Sync optional
      }
    }

    getCurrentUser().then(handleAuth)
    const { unsubscribe } = onAuthStateChange((_, session) => {
      handleAuth(session?.user ?? null)
    })
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (items.length === 0) mergedRef.current = false
  }, [items.length])

  return null
}
