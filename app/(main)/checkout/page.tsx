'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingBag, User, MapPin, Check, AlertCircle, Loader2, TicketPercent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCartStore } from '@/store/cart'
import { getCurrentUser } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase'
import { formatPrice, isValidUUID, getEffectivePrice } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

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

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser ?? null)
      if (currentUser?.email) {
        setShippingAddress((prev) => ({ ...prev, email: currentUser.email ?? prev.email }))
      }
      if (currentUser?.id) {
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
            email: addr.email ?? prev.email,
            first_name: addr.first_name ?? prev.first_name,
            last_name: addr.last_name ?? prev.last_name,
            street: addr.street ?? prev.street,
            house_number: addr.house_number ?? prev.house_number,
            postal_code: addr.postal_code ?? prev.postal_code,
            city: addr.city ?? prev.city,
            country: addr.country ?? prev.country,
            phone: addr.phone ?? prev.phone,
          }))
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

    setIsProcessing(true)

    try {
      const orderNumber = generateOrderNumber()
      const subtotal = getSubtotal()
      const shipping = getShipping()
      const discountAmount = appliedDiscount?.amount ?? 0
      const total = Math.max(0, subtotal + shipping - discountAmount)

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
          discount_code: appliedDiscount?.code ?? null,
          discount_amount: discountAmount,
          items: orderItemsPayload,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Checkout fehlgeschlagen')
      }

      toast({
        title: 'Weiterleitung zur Zahlung',
        description: `Bestellung #${orderNumber} – du wirst zu Mollie weitergeleitet.`,
      })

      clearCart()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        router.push(`/order-confirmation?order=${orderNumber}`)
      }
    } catch (error: any) {
      console.error('Order error:', error)
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
  const discountAmount = appliedDiscount?.amount ?? 0
  const total = Math.max(0, subtotal + shipping - discountAmount)
  const needsAdultCheck = hasAdultItems()
  const hasInvalidCartItems = items.some((item) => !isValidUUID(item.product.id))

  return (
    <div className="min-h-screen bg-luxe-black py-12">
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
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Checkout</h1>
          <p className="text-luxe-silver">Schließe deine Bestellung ab</p>
        </motion.div>

        {/* Option: Als Gast oder anmelden */}
        {!user && (
          <div className="mb-6 p-4 bg-luxe-charcoal border border-luxe-gray rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-luxe-silver">
              Du bestellst als <strong className="text-white">Gast</strong>. Du kannst dich anmelden, um deine Bestellungen im Kundenkonto zu sehen.
            </p>
            <Button
              type="button"
              variant="outline"
              className="border-luxe-gold text-luxe-gold shrink-0"
              onClick={() => router.push('/auth?redirect=/checkout')}
            >
              Anmelden / Registrieren
            </Button>
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
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
                  </div>

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
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="luxe"
                    size="lg"
                    className="w-full"
                    disabled={isProcessing}
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
                    Mit der Bestellung akzeptierst du unsere AGB
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
