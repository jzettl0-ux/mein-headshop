'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingBag, User, MapPin, Check, AlertCircle, Loader2, TicketPercent, Gift, Coins, Lock, Shield, Truck, Package, Share2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCartStore } from '@/store/cart'
import { getCurrentUser } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase'
import { formatPrice, isValidUUID, getEffectivePrice } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { getStoredReferralCode } from '@/components/referral-capture'
import { getStoredAffiliateCode } from '@/components/affiliate-capture'
import { REFERRAL_DISCOUNT_EUR, REFERRAL_MIN_ORDER_SUBTOTAL } from '@/lib/referral'
import { getDeliveryEstimateText } from '@/lib/shipping'
import { CheckoutGuard } from '@/components/checkout-guard'
import { VoucherBadges } from '@/components/shop/voucher-badges'

interface ShippingAddress {
  email: string
  first_name: string
  last_name: string
  street: string
  house_number: string
  postal_code: string
  city: string
  country: string
  phone: string
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  const { items, getSubtotal, getShipping, getTotal, hasAdultItems, clearCart } = useCartStore()

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    email: '',
    first_name: '',
    last_name: '',
    street: '',
    house_number: '',
    postal_code: '',
    city: '',
    country: 'Deutschland',
    phone: '',
  })
  const [discountInput, setDiscountInput] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null)
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  const [loyaltyData, setLoyaltyData] = useState<{
    points_balance: number
    tier: 'bronze' | 'silver' | 'gold'
    settings: { points_per_eur_discount: number; silver_discount_percent: number; gold_discount_percent: number; min_order_eur_for_discount?: number }
  } | null>(null)
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [usedSavedAddress, setUsedSavedAddress] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: string; label: string | null; first_name: string; last_name: string; street: string; house_number: string; postal_code: string; city: string; country: string; phone: string; is_default: boolean }>>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new')
  const [orderNote, setOrderNote] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [splitPaymentMode, setSplitPaymentMode] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [packages, setPackages] = useState<Array<{ seller_name: string; seller_type: string; items: { name: string; quantity: number; price: number }[]; subtotal: number }>>([])
  const [packagesLoading, setPackagesLoading] = useState(false)
  const [oneClickEnabled, setOneClickEnabled] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    checkAuth()
    setReferralCode(getStoredReferralCode())
  }, [])

  useEffect(() => {
    const d = searchParams.get('discount')
    if (d && typeof d === 'string' && d.trim()) {
      setDiscountInput(d.trim().toUpperCase())
    }
  }, [searchParams])

  useEffect(() => {
    if (hasAdultItems() && typeof window !== 'undefined') {
      const token = sessionStorage.getItem('age_verification_token')
      if (!token) {
        router.replace(`/checkout/age-verification?returnTo=${encodeURIComponent('/checkout')}`)
      }
    }
  }, [hasAdultItems, router])

  useEffect(() => {
    if (items.length === 0) return
    fetch('/api/cart/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.session_id && typeof window !== 'undefined') sessionStorage.setItem('cart_session_id', d.session_id)
      })
      .catch(() => {})
  }, [items])

  useEffect(() => {
    if (items.length === 0) {
      setPackages([])
      return
    }
    setPackagesLoading(true)
    fetch('/api/checkout/packages-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      }),
    })
      .then((r) => r.json())
      .then((d) => setPackages(d?.packages ?? []))
      .catch(() => setPackages([]))
      .finally(() => setPackagesLoading(false))
  }, [items])

  const applyAddressToForm = (addr: { first_name: string; last_name: string; street: string; house_number: string; postal_code: string; city: string; country: string; phone: string }, email: string) => {
    setShippingAddress((prev) => ({
      ...prev,
      email: email || prev.email,
      first_name: addr.first_name ?? '',
      last_name: addr.last_name ?? '',
      street: addr.street ?? '',
      house_number: addr.house_number ?? '',
      postal_code: addr.postal_code ?? '',
      city: addr.city ?? '',
      country: addr.country ?? 'Deutschland',
      phone: addr.phone ?? '',
    }))
  }

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser ?? null)
      const email = currentUser?.email ?? ''
      if (currentUser?.email) {
        setShippingAddress((prev) => ({ ...prev, email }))
      }
      if (currentUser?.id) {
        fetch('/api/account/loyalty')
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d && d.enabled !== false && setLoyaltyData({ points_balance: d.points_balance, tier: d.tier, settings: d.settings }))
          .catch(() => {})
        const { data: addressesData } = await supabase
          .from('customer_addresses')
          .select('id, label, first_name, last_name, street, house_number, postal_code, city, country, phone, is_default')
          .eq('user_id', currentUser.id)
          .order('is_default', { ascending: false })
        const addrs = addressesData || []
        setSavedAddresses(addrs)

        if (addrs.length > 0) {
          const defaultOrFirst = addrs.find(a => a.is_default) || addrs[0]
          setSelectedAddressId(defaultOrFirst.id)
          applyAddressToForm(defaultOrFirst, email)
          setUsedSavedAddress(true)
        }
        fetch('/api/account/checkout-preferences', { credentials: 'include' })
          .then((r) => (r.ok ? r.json() : null))
          .then((prefs) => prefs && setOneClickEnabled(Boolean(prefs.one_click_enabled)))
          .catch(() => {})
        if (addrs.length === 0) {
          const { data: lastOrder } = await supabase
            .from('orders')
            .select('shipping_address')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          const addr = lastOrder?.shipping_address as Record<string, string> | null
          if (addr) {
            setShippingAddress((prev) => ({
              ...prev,
              email: (addr.email as string) ?? email,
              first_name: (addr.first_name as string) ?? prev.first_name,
              last_name: (addr.last_name as string) ?? prev.last_name,
              street: (addr.street as string) ?? prev.street,
              house_number: (addr.house_number as string) ?? prev.house_number,
              postal_code: (addr.postal_code as string) ?? prev.postal_code,
              city: (addr.city as string) ?? prev.city,
              country: (addr.country as string) ?? prev.country,
              phone: (addr.phone as string) ?? prev.phone,
            }))
            setUsedSavedAddress(true)
          }
          setSelectedAddressId('new')
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `ORD-${timestamp}-${random}`
  }

  const handleApplyDiscount = async () => {
    const code = discountInput.trim().toUpperCase()
    if (!code) return
    setApplyingDiscount(true)
    try {
      const res = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: getSubtotal() }),
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedDiscount({ code: data.code, amount: data.discountAmount })
        toast({ title: 'Rabatt angewendet', description: `${formatPrice(data.discountAmount)} Ersparnis` })
      } else {
        setAppliedDiscount(null)
        toast({ title: data.message || 'Code ungültig', variant: 'destructive' })
      }
    } catch {
      setAppliedDiscount(null)
      toast({ title: 'Fehler bei der Prüfung', variant: 'destructive' })
    } finally {
      setApplyingDiscount(false)
    }
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast({
        title: 'Warenkorb ist leer',
        description: 'Füge Produkte hinzu, bevor du bestellst.',
        variant: 'destructive',
      })
      return
    }

    // Prüfen: Alle Produkt-IDs müssen gültige UUIDs sein (aus der Datenbank)
    const invalidItems = items.filter((item) => !isValidUUID(item.product.id))
    if (invalidItems.length > 0) {
      toast({
        title: 'Veraltete Artikel im Warenkorb',
        description:
          'Einige Artikel haben keine gültige ID. Bitte leere den Warenkorb und lege die Produkte erneut aus dem Shop in den Warenkorb.',
        variant: 'destructive',
      })
      return
    }

    // DSGVO/DDG: Pflicht-Einwilligungen vor Bestellung (Art. 6 Abs. 1 lit. a DSGVO)
    if (!privacyAccepted || !termsAccepted) {
      setCheckoutError('Bitte bestätige die Datenschutzerklärung und die AGB.')
      toast({
        title: 'Bestätigung erforderlich',
        description: 'Du musst der Datenschutzerklärung und den AGB zustimmen.',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)

    try {
      const orderNumber = generateOrderNumber()
      const subtotal = getSubtotal()
      const shipping = getShipping()
      const pointsPerEurCalc = loyaltyData?.settings.points_per_eur_discount || 20
      const minOrderCalc = loyaltyData?.settings.min_order_eur_for_discount ?? 0
      const discCodeCalc = Math.min(subtotal, appliedDiscount?.amount ?? 0)
      const discTierCalc =
        subtotal >= minOrderCalc
          ? (loyaltyData?.tier === 'silver'
            ? (subtotal * (loyaltyData.settings.silver_discount_percent || 0)) / 100
            : loyaltyData?.tier === 'gold'
              ? (subtotal * (loyaltyData.settings.gold_discount_percent || 0)) / 100
              : 0)
          : 0
      const redeemRawCalc = Math.min(pointsToRedeem, loyaltyData?.points_balance ?? 0)
      const discPointsCalc = Math.min(redeemRawCalc / pointsPerEurCalc, subtotal)
      const discRefCalc =
        referralCode && subtotal >= REFERRAL_MIN_ORDER_SUBTOTAL
          ? Math.min(REFERRAL_DISCOUNT_EUR, subtotal + shipping)
          : 0
      const bestValueCalc = Math.max(discCodeCalc, discTierCalc, discPointsCalc, discRefCalc)
      const useCodeCalc = bestValueCalc === discCodeCalc && discCodeCalc > 0
      const useTierCalc = bestValueCalc === discTierCalc && discTierCalc > 0
      const usePointsCalc = bestValueCalc === discPointsCalc && discPointsCalc > 0
      const useRefCalc = bestValueCalc === discRefCalc && discRefCalc > 0

      const discountAmount = useCodeCalc ? discCodeCalc : 0
      const tierDiscount = useTierCalc ? discTierCalc : 0
      const redeem = usePointsCalc ? Math.floor(discPointsCalc * pointsPerEurCalc) : 0
      const refCodeToSend = useRefCalc && referralCode && subtotal >= REFERRAL_MIN_ORDER_SUBTOTAL ? referralCode : null
      const total = Math.max(0, subtotal + shipping - bestValueCalc)

      const customerEmail = user?.email ?? shippingAddress.email
      if (!customerEmail?.trim()) {
        toast({
          title: 'E-Mail fehlt',
          description: 'Bitte gib deine E-Mail-Adresse ein (Kontaktdaten).',
          variant: 'destructive',
        })
        setIsProcessing(false)
        return
      }

      const orderItemsPayload = items.map(item => {
        const unitPrice = getEffectivePrice(item.product)
        return {
          product_id: item.product.id,
          product_name: item.product.name,
          product_image: item.product.image_url,
          quantity: item.quantity,
          price: unitPrice,
        }
      })

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          user_id: user?.id ?? null,
          customer_email: customerEmail.trim(),
          customer_name: `${shippingAddress.first_name} ${shippingAddress.last_name}`,
          shipping_address: shippingAddress,
          billing_address: shippingAddress,
          subtotal,
          shipping_cost: shipping,
          total,
          has_adult_items: hasAdultItems(),
          discount_code: useCodeCalc ? (appliedDiscount?.code ?? null) : null,
          discount_amount: discountAmount,
          loyalty_points_redeemed: redeem,
          loyalty_tier_discount_amount: tierDiscount,
          referral_code: refCodeToSend,
          affiliate_code: typeof getStoredAffiliateCode === 'function' ? getStoredAffiliateCode() : null,
          items: orderItemsPayload,
          cart_session_id: typeof window !== 'undefined' ? sessionStorage.getItem('cart_session_id') : null,
          order_note: orderNote.trim() || null,
          age_verification_token: hasAdultItems() && typeof window !== 'undefined' ? sessionStorage.getItem('age_verification_token') : null,
          payment_mode: splitPaymentMode && user ? 'split' : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        const msg = data.error || 'Checkout fehlgeschlagen'
        setCheckoutError(msg)
        throw new Error(msg)
      }
      setCheckoutError(null)

      clearCart()
      if (hasAdultItems() && typeof window !== 'undefined') {
        sessionStorage.removeItem('age_verification_token')
      }

      if (data.needs_approval) {
        toast({
          title: 'Bestellung wartet auf Freigabe',
          description: data.message || 'Ihr Einkaufsverantwortlicher wurde benachrichtigt.',
        })
        router.push(`/order-confirmation?order=${orderNumber}&approval_pending=1`)
        return
      }

      if (data.split_url) {
        toast({ title: 'Rechnung zum Teilen erstellt', description: data.message })
        window.location.href = data.split_url
        return
      }

      toast({
        title: 'Weiterleitung zur Zahlung',
        description: `Bestellung #${orderNumber} – du wirst zu Mollie weitergeleitet.`,
      })

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        router.push(`/order-confirmation?order=${orderNumber}`)
      }
    } catch (error: any) {
      console.error('Order error:', error)
      setCheckoutError(error?.message || 'Bitte versuche es erneut.')
      toast({
        title: 'Bestellung fehlgeschlagen',
        description: error.message || 'Bitte versuche es erneut.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-luxe-gold animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-luxe-silver/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Dein Warenkorb ist leer
          </h2>
          <p className="text-luxe-silver mb-6">
            Füge Produkte hinzu, um eine Bestellung aufzugeben
          </p>
          <Button variant="luxe" size="lg" onClick={() => router.push('/shop')}>
            Zum Shop
          </Button>
        </div>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const shipping = getShipping()
  const pointsPerEur = loyaltyData?.settings.points_per_eur_discount || 20
  const minOrderForDiscount = loyaltyData?.settings.min_order_eur_for_discount ?? 0

  // Nur ein Rabatt anwendbar – der mit dem höchsten Ersparnisbetrag
  const discCode = Math.min(subtotal, appliedDiscount?.amount ?? 0)
  const discTier =
    subtotal >= minOrderForDiscount
      ? (loyaltyData?.tier === 'silver'
        ? (subtotal * (loyaltyData.settings.silver_discount_percent || 0)) / 100
        : loyaltyData?.tier === 'gold'
          ? (subtotal * (loyaltyData.settings.gold_discount_percent || 0)) / 100
          : 0)
      : 0
  const redeemRaw = Math.min(pointsToRedeem, loyaltyData?.points_balance ?? 0)
  const discPoints = Math.min(redeemRaw / pointsPerEur, subtotal)
  const discRef =
    referralCode && subtotal >= REFERRAL_MIN_ORDER_SUBTOTAL
      ? Math.min(REFERRAL_DISCOUNT_EUR, subtotal + shipping)
      : 0

  const bestValue = Math.max(discCode, discTier, discPoints, discRef)
  const useCode = bestValue === discCode && discCode > 0
  const useTier = bestValue === discTier && discTier > 0
  const usePoints = bestValue === discPoints && discPoints > 0
  const useRef = bestValue === discRef && discRef > 0

  const discountAmount = useCode ? discCode : 0
  const tierDiscount = useTier ? discTier : 0
  const pointsDiscountEuro = usePoints ? discPoints : 0
  const actualPointsRedeem = Math.floor(pointsDiscountEuro * pointsPerEur)
  const referralDiscountApplied = useRef ? discRef : 0

  const total = Math.max(0, subtotal + shipping - bestValue)
  const needsAdultCheck = hasAdultItems()
  const maxRedeemablePoints = Math.min(
    loyaltyData?.points_balance ?? 0,
    Math.floor(subtotal * pointsPerEur)
  )
  const hasInvalidCartItems = items.some((item) => !isValidUUID(item.product.id))

  return (
    <div className="min-h-screen bg-luxe-black py-6 sm:py-12">
      <CheckoutGuard />
      <div className="container-luxe">
        {hasInvalidCartItems && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-red-400 font-semibold">Veraltete Artikel im Warenkorb</p>
              <p className="text-red-400/80 text-sm mt-1">
                Einige Artikel haben keine gültige ID. Leere den Warenkorb und lege die Produkte erneut aus dem Shop in den Warenkorb.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-red-500/50 text-red-400 shrink-0"
              onClick={() => {
                clearCart()
                router.push('/shop')
              }}
            >
              Warenkorb leeren und zum Shop
            </Button>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Kasse</h1>
          <p className="text-luxe-silver text-sm sm:text-base">Schließe deine Bestellung ab</p>
        </motion.div>

        {/* Option: Anmelden und gespeicherte Daten nutzen oder als Gast */}
        {!user && (
          <div className="mb-6 p-4 bg-luxe-charcoal border border-luxe-gray rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-luxe-silver">
              Du bestellst als <strong className="text-white">Gast</strong>.{' '}
              <strong className="text-white">Jetzt anmelden</strong>, um deine hinterlegten Adressdaten zu übernehmen und Bestellungen in deinem Konto zu sehen – oder hier die Felder manuell ausfüllen.
            </p>
            <Button
              type="button"
              variant="outline"
              className="border-luxe-gold text-luxe-gold shrink-0"
              onClick={() => router.push('/auth?redirect=/checkout')}
            >
              Anmelden & Daten übernehmen
            </Button>
          </div>
        )}

        {/* 1-Click aktivieren (nur wenn eingeloggt + Adressen) */}
        {user && savedAddresses.length > 0 && (
          <Card className="mb-6 bg-luxe-charcoal border-luxe-gray border-luxe-gold/30">
            <CardContent className="pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={oneClickEnabled}
                  onChange={(e) => {
                    const v = e.target.checked
                    setOneClickEnabled(v)
                    fetch('/api/account/checkout-preferences', {
                      method: 'PATCH',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ one_click_enabled: v }),
                    }).catch(() => {})
                  }}
                  className="rounded border-luxe-gray bg-luxe-charcoal text-luxe-gold focus:ring-luxe-gold"
                />
                <span className="text-white font-medium">1-Click Checkout aktivieren</span>
              </label>
              <p className="text-luxe-silver text-sm mt-1 ml-6">
                Beim nächsten Mal kannst du mit einem Klick bestellen (gespeicherte Adresse + AGB werden übernommen).
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lieferadresse wählen (gespeicherte Adressen) */}
        {user && savedAddresses.length > 0 && (
          <Card className="mb-6 bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-luxe-gold" />
                Lieferadresse wählen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedAddressId}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedAddressId(val)
                  if (val === 'new') {
                    setShippingAddress((prev) => ({
                      ...prev,
                      first_name: '',
                      last_name: '',
                      street: '',
                      house_number: '',
                      postal_code: '',
                      city: '',
                      country: 'Deutschland',
                      phone: '',
                    }))
                  } else {
                    const addr = savedAddresses.find(a => a.id === val)
                    if (addr) applyAddressToForm(addr, user?.email ?? '')
                  }
                }}
                className="w-full rounded-md border border-luxe-silver bg-luxe-gray px-4 py-3 text-white focus:border-luxe-gold focus:ring-1 focus:ring-luxe-gold"
              >
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label || `${addr.first_name} ${addr.last_name}`} – {addr.street} {addr.house_number}, {addr.postal_code} {addr.city}
                  </option>
                ))}
                <option value="new">Neue Adresse eingeben</option>
              </select>
              <p className="text-luxe-silver text-xs mt-2">
                Du kannst die Felder unten bei Bedarf anpassen.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Hinweis wenn nur letzte Bestellung übernommen (keine gespeicherten Adressen) */}
        {user && usedSavedAddress && savedAddresses.length === 0 && (
          <div className="mb-6 p-4 bg-luxe-charcoal border border-luxe-gold/40 rounded-lg">
            <p className="text-luxe-silver text-sm">
              <strong className="text-luxe-gold">Deine letzte Lieferadresse</strong> wurde eingetragen. Du kannst die Felder unten anpassen oder Adressen in deinem <Link href="/account" className="text-luxe-gold hover:underline">Kundenkonto</Link> speichern.
            </p>
          </div>
        )}

        <form ref={formRef} onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* User Info */}
              <Card className="bg-luxe-charcoal border-luxe-gray">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <User className="w-5 h-5 mr-2 text-luxe-gold" />
                    Kontaktdaten
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-white">E-Mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingAddress.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-luxe-gray border-luxe-silver text-white"
                      placeholder="deine@email.de"
                      required
                      readOnly={!!user}
                    />
                    {user && <p className="text-xs text-luxe-silver mt-1">Angemeldet als {user.email}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name" className="text-white">Vorname *</Label>
                      <Input
                        id="first_name"
                        value={shippingAddress.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        className="bg-luxe-gray border-luxe-silver text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name" className="text-white">Nachname *</Label>
                      <Input
                        id="last_name"
                        value={shippingAddress.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        className="bg-luxe-gray border-luxe-silver text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white">Telefon *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="bg-luxe-gray border-luxe-silver text-white"
                      placeholder="+49 123 456789"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card className="bg-luxe-charcoal border-luxe-gray">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-luxe-gold" />
                    Lieferadresse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                      <Label htmlFor="street" className="text-white">Straße *</Label>
                      <Input
                        id="street"
                        value={shippingAddress.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        className="bg-luxe-gray border-luxe-silver text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="house_number" className="text-white">Nr. *</Label>
                      <Input
                        id="house_number"
                        value={shippingAddress.house_number}
                        onChange={(e) => handleInputChange('house_number', e.target.value)}
                        className="bg-luxe-gray border-luxe-silver text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="postal_code" className="text-white">PLZ *</Label>
                      <Input
                        id="postal_code"
                        value={shippingAddress.postal_code}
                        onChange={(e) => handleInputChange('postal_code', e.target.value)}
                        className="bg-luxe-gray border-luxe-silver text-white"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="city" className="text-white">Stadt *</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="bg-luxe-gray border-luxe-silver text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-luxe-gray">
                    <Label htmlFor="order_note" className="text-white">Bestellnotiz (optional)</Label>
                    <Textarea
                      id="order_note"
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="z.B. Klingel defekt, bitte bei Nachbarn abgeben"
                      rows={2}
                      className="bg-luxe-gray border-luxe-silver text-white placeholder:text-luxe-silver resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-luxe-charcoal border-luxe-gray sticky top-24">
                <CardHeader>
                  <CardTitle className="text-white">Bestellübersicht</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Packages-Anzeige (Phase 3.2) – nur wenn mehrere Pakete */}
                  {packages.length > 1 && (
                    <div className="rounded-lg border border-luxe-gold/40 bg-luxe-gold/5 p-3 space-y-2">
                      <p className="text-sm font-medium text-luxe-gold flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {packagesLoading ? 'Lade Paketübersicht…' : `${packages.length} getrennte Lieferungen`}
                      </p>
                      {!packagesLoading && packages.map((pkg, idx) => (
                        <div key={idx} className="text-xs text-luxe-silver">
                          <span className="font-medium text-white">{pkg.seller_name}</span>
                          <span className="ml-1">• {pkg.items.length} Artikel • {formatPrice(pkg.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => {
                      const unitPrice = getEffectivePrice(item.product)
                      return (
                        <div key={item.product.id} className="flex items-center space-x-3 text-sm">
                          <div className="w-12 h-12 bg-luxe-gray rounded flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white truncate">{item.product.name}</p>
                            <p className="text-luxe-silver">{item.quantity}x</p>
                          </div>
                          <p className="text-white font-semibold">
                            {formatPrice(unitPrice * item.quantity)}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Voucher Badges (klickbar) */}
                  <VoucherBadges subtotal={getSubtotal()} onApply={(code) => setDiscountInput(code.toUpperCase())} />

                  {/* Rabattcode */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Rabattcode</Label>
                    <div className="flex gap-2">
                      <Input
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                        placeholder="z.B. SOMMER20"
                        className="bg-luxe-gray border-luxe-silver text-white font-mono flex-1"
                        disabled={!!appliedDiscount}
                      />
                      {appliedDiscount ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => { setAppliedDiscount(null); setDiscountInput('') }}
                          className="shrink-0"
                        >
                          Entfernen
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleApplyDiscount}
                          disabled={applyingDiscount || !discountInput.trim()}
                          className="shrink-0"
                        >
                          {applyingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : <TicketPercent className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                    {appliedDiscount && (
                      <p className="text-green-400 text-xs">
                        Code {appliedDiscount.code}: −{formatPrice(appliedDiscount.amount)}
                      </p>
                    )}
                    <p className="text-luxe-silver/70 text-xs mt-1">
                      Es ist nur ein Rabatt anwendbar – der mit dem höchsten Ersparnisbetrag wird automatisch gewählt.
                    </p>
                  </div>

                  {/* Loyalty: Punkte einlösen (nur wenn angemeldet + Punkte) */}
                  {user && loyaltyData && loyaltyData.points_balance > 0 && (
                    <div className="space-y-2">
                      <Label className="text-white text-sm flex items-center gap-1">
                        <Coins className="w-4 h-4 text-luxe-gold" />
                        Punkte einlösen ({loyaltyData.points_balance} verfügbar)
                      </Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          min={0}
                          max={maxRedeemablePoints}
                          value={pointsToRedeem || ''}
                          onChange={(e) => setPointsToRedeem(Math.max(0, Math.min(maxRedeemablePoints, parseInt(e.target.value, 10) || 0)))}
                          placeholder="0"
                          className="bg-luxe-gray border-luxe-silver text-white w-24"
                        />
                        <span className="text-luxe-silver text-xs">
                          {pointsPerEur} Punkte = 1€ Rabatt
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 18+ Notice */}
                  {needsAdultCheck && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        18+ DHL Ident-Check erforderlich
                      </p>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-2 pt-4 border-t border-luxe-gray">
                    <div className="flex justify-between text-luxe-silver">
                      <span>Zwischensumme</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-luxe-silver">
                      <span>Versand</span>
                      <span>{formatPrice(shipping)}</span>
                    </div>
                    {appliedDiscount && appliedDiscount.amount > 0 && (
                      <div className="flex justify-between text-green-400 text-sm">
                        <span>Rabatt ({appliedDiscount.code})</span>
                        <span>− {formatPrice(appliedDiscount.amount)}</span>
                      </div>
                    )}
                    {tierDiscount > 0 && (
                      <div className="flex justify-between text-amber-400 text-sm">
                        <span>Status-Rabatt ({loyaltyData?.tier === 'gold' ? 'Gold' : 'Silber'})</span>
                        <span>− {formatPrice(tierDiscount)}</span>
                      </div>
                    )}
                    {actualPointsRedeem > 0 && (
                      <div className="flex justify-between text-green-400 text-sm">
                        <span>Punkte ({actualPointsRedeem})</span>
                        <span>− {formatPrice(pointsDiscountEuro)}</span>
                      </div>
                    )}
                    {referralDiscountApplied > 0 && (
                      <div className="flex justify-between text-green-400 text-sm">
                        <span>Freundesrabatt (Empfehlung)</span>
                        <span>− {formatPrice(referralDiscountApplied)}</span>
                      </div>
                    )}
                    {needsAdultCheck && (
                      <div className="flex justify-between text-red-400 text-sm">
                        <span>DHL Ident-Check</span>
                        <span>+ {formatPrice(2.00)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-luxe-gray">
                      <span className="text-white font-bold text-lg">Gesamt</span>
                      <span className="text-luxe-gold font-bold text-2xl">
                        {formatPrice(total)}
                      </span>
                    </div>
                    <p className="text-luxe-silver/80 text-xs pt-1">
                      Inkl. gesetzlicher USt. zzgl. Versand
                    </p>
                    <p className="text-emerald-500/90 text-xs pt-2 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      Lieferung voraussichtlich in {getDeliveryEstimateText()}
                    </p>
                  </div>

                  {/* Widerrufsfrist (klar sichtbar) */}
                  <p className="text-luxe-silver text-sm text-center py-2 border-t border-luxe-gray/60">
                    <strong className="text-white">Widerrufsfrist:</strong> 14 Tage¹ ab dem Tag, an dem du die Ware erhältst. ¹Ausnahmen möglich. Details in unserer{' '}
                    <Link href="/returns#ausnahmen" className="text-luxe-gold hover:underline">Widerrufsbelehrung</Link>.
                  </p>

                  {/* DSGVO: Pflicht-Checkboxen vor Vertragsschluss */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer text-sm text-luxe-silver">
                      <input
                        type="checkbox"
                        checked={privacyAccepted}
                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                        className="mt-1 rounded border-luxe-gray bg-luxe-charcoal text-luxe-gold focus:ring-luxe-gold"
                      />
                      <span>
                        Ich habe die <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-luxe-gold hover:underline">Datenschutzerklärung</Link> zur Kenntnis genommen und stimme der Verarbeitung meiner Daten zu.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer text-sm text-luxe-silver">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-1 rounded border-luxe-gray bg-luxe-charcoal text-luxe-gold focus:ring-luxe-gold"
                      />
                      <span>
                        Ich habe die <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-luxe-gold hover:underline">AGB</Link> und die <Link href="/returns" target="_blank" rel="noopener noreferrer" className="text-luxe-gold hover:underline">Widerrufsbelehrung</Link> gelesen und akzeptiere diese.
                      </span>
                    </label>
                    {user && (
                      <label className="flex items-start gap-3 cursor-pointer text-sm text-luxe-silver">
                        <input
                          type="checkbox"
                          checked={splitPaymentMode}
                          onChange={(e) => setSplitPaymentMode(e.target.checked)}
                          className="mt-1 rounded border-luxe-gray bg-luxe-charcoal text-luxe-gold focus:ring-luxe-gold"
                        />
                        <span>
                          <Share2 className="w-4 h-4 text-luxe-gold inline-block mr-1 -mt-0.5 align-middle" />
                          Rechnung mit Freunden teilen – Link erstellen, Freunde zahlen ihre Anteile.
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Trust-Strip */}
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-3 text-xs text-luxe-silver border-y border-luxe-gray/60">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      Sichere Zahlung (Mollie)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      SSL-verschlüsselt
                    </span>
                    <Link href="/impressum" className="hover:text-luxe-gold transition-colors">Impressum</Link>
                    <Link href="/privacy" className="hover:text-luxe-gold transition-colors">Datenschutz</Link>
                    <Link href="/terms" className="hover:text-luxe-gold transition-colors">Widerruf & AGB</Link>
                  </div>

                  {/* Fehlermeldung nah am Button (nicht nur Toast) */}
                  {checkoutError && (
                    <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-400">Bestellung fehlgeschlagen</p>
                        <p className="text-sm text-red-300/90 mt-0.5">{checkoutError}</p>
                        <button
                          type="button"
                          onClick={() => setCheckoutError(null)}
                          className="text-xs text-red-400 hover:text-red-300 underline mt-2"
                        >
                          Meldung schließen
                        </button>
                      </div>
                    </div>
                  )}
                  {/* 1-Click kaufen (wenn aktiviert und Adresse gewählt) */}
                  {oneClickEnabled && user && savedAddresses.length > 0 && items.length > 0 && selectedAddressId !== 'new' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full min-h-[48px] border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10 mb-3"
                      disabled={isProcessing}
                      onClick={() => {
                        setPrivacyAccepted(true)
                        setTermsAccepted(true)
                        setTimeout(() => formRef.current?.requestSubmit(), 0)
                      }}
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Mit 1-Click kaufen
                    </Button>
                  )}
                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="luxe"
                    size="lg"
                    className="w-full min-h-[48px]"
                    disabled={isProcessing || !privacyAccepted || !termsAccepted}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Wird verarbeitet...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Zahlungspflichtig bestellen
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-luxe-silver text-center">
                    Mit der Bestellung schließt du einen verbindlichen Kaufvertrag ab.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
