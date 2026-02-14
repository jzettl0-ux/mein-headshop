'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calculator, Package, Truck, CreditCard, Building2, Info, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  bongs: 'Bongs',
  grinder: 'Grinder',
  papers: 'Papers',
  vaporizer: 'Vaporizer',
  zubehoer: 'Zubehör',
  'influencer-drops': 'Influencer Drops',
}

/**
 * Break-even: Verkaufspreis so dass Erlös - alle Kosten = 0 (oder Plus).
 * Kosten pro Artikel: Einkauf + Zahlungsgebühr + Versandanteil + Shop-Anteil + Verpackung.
 */
function round2(n: number) {
  return Math.round(n * 100) / 100
}

type ProductRow = {
  id: string
  name: string
  price: number
  cost_price: number | null
  category: string
  total_sold: number | null
}

export default function AdminMarginPage() {
  const [costPrice, setCostPrice] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')

  const [paymentPercent, setPaymentPercent] = useState('2.9')
  const [paymentFixed, setPaymentFixed] = useState('0.29')
  const [shippingPerOrder, setShippingPerOrder] = useState('4.90')
  const [itemsPerOrder, setItemsPerOrder] = useState('2')
  const [shopMonthly, setShopMonthly] = useState('50')
  const [ordersPerMonth, setOrdersPerMonth] = useState('30')
  const [packagingPerItem, setPackagingPerItem] = useState('0.50')

  const [products, setProducts] = useState<ProductRow[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [salesByProduct, setSalesByProduct] = useState<Record<string, { count: number; avgPrice: number }>>({})

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name, price, cost_price, category, total_sold')
      .order('name')
      .then(({ data }) => setProducts(data || []))
  }, [])

  useEffect(() => {
    supabase
      .from('order_items')
      .select('product_id, quantity, price')
      .then(({ data }) => {
        const byId: Record<string, { totalQty: number; sum: number }> = {}
        ;(data || []).forEach((row: { product_id: string; quantity: number; price: number }) => {
          if (!row.product_id) return
          if (!byId[row.product_id]) byId[row.product_id] = { totalQty: 0, sum: 0 }
          byId[row.product_id].totalQty += row.quantity
          byId[row.product_id].sum += row.price * row.quantity
        })
        const result: Record<string, { count: number; avgPrice: number }> = {}
        Object.entries(byId).forEach(([id, v]) => {
          result[id] = { count: v.totalQty, avgPrice: v.totalQty > 0 ? v.sum / v.totalQty : 0 }
        })
        setSalesByProduct(result)
      })
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      const p = products.find((x) => x.id === selectedProduct)
      if (p) {
        setCostPrice(p.cost_price != null ? String(p.cost_price) : '')
        setSellingPrice(String(p.price))
      }
    }
  }, [selectedProduct, products])

  const selectedProductData = selectedProduct ? products.find((p) => p.id === selectedProduct) : null
  const currentPrice = parseFloat(sellingPrice) || 0

  const similarProducts = useMemo(() => {
    if (!selectedProductData || currentPrice <= 0) return []
    const category = selectedProductData.category
    const minP = currentPrice * 0.65
    const maxP = currentPrice * 1.35
    return products.filter(
      (p) =>
        p.id !== selectedProductData.id &&
        p.category === category &&
        p.price >= minP &&
        p.price <= maxP
    )
  }, [products, selectedProductData, currentPrice])

  const similarStats = useMemo(() => {
    if (similarProducts.length === 0) return null
    const prices = similarProducts.map((p) => p.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    return { min: round2(min), max: round2(max), avg: round2(avg), count: similarProducts.length }
  }, [similarProducts])

  const salesInfo = selectedProduct ? salesByProduct[selectedProduct] : null

  const cost = parseFloat(costPrice) || 0
  const payPct = parseFloat(paymentPercent) || 0
  const payFix = parseFloat(paymentFixed) || 0
  const shipOrder = parseFloat(shippingPerOrder) || 0
  const itemsOrder = Math.max(0.1, parseFloat(itemsPerOrder) || 1)
  const shopMon = parseFloat(shopMonthly) || 0
  const ordersMon = Math.max(0.1, parseFloat(ordersPerMonth) || 1)
  const packaging = parseFloat(packagingPerItem) || 0

  const shippingPerItem = shipOrder / itemsOrder
  const shopPerOrder = shopMon / ordersMon
  const shopPerItem = shopPerOrder / itemsOrder

  const costTotalPerItem = cost + payFix + shippingPerItem + shopPerItem + packaging

  const breakEvenPrice = payPct >= 100 ? 0 : costTotalPerItem / (1 - payPct / 100)
  const breakEvenRounded = round2(breakEvenPrice)

  const sell = parseFloat(sellingPrice) || 0
  const paymentFeeOnSell = sell * (payPct / 100) + payFix
  const profitPerItem = sell - cost - paymentFeeOnSell - shippingPerItem - shopPerItem - packaging
  const profitRounded = round2(profitPerItem)
  const marginPercent = sell > 0 ? round2((profitPerItem / sell) * 100) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Calculator className="w-8 h-8 text-luxe-gold" />
          Kostenrechner & Mindestverkaufspreis
        </h1>
        <p className="text-luxe-silver mt-1">
          Einkaufspreis und alle Kosten eingeben – du siehst, ab welchem Verkaufspreis du plus machst und wie viel Gewinn bei deinem Preis bleibt.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Deine Kosten (Standardwerte)</CardTitle>
            <p className="text-sm text-luxe-silver">
              Passe die Werte an deine echten Zahlen an. Beispiele: Mollie ~2,9 % + 0,29 €; DHL ~4,90 €.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-luxe-gold" />
                  Zahlung % (z. B. Mollie)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={paymentPercent}
                  onChange={(e) => setPaymentPercent(e.target.value)}
                  className="bg-luxe-gray border-luxe-silver text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white">Zahlung Fix (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentFixed}
                  onChange={(e) => setPaymentFixed(e.target.value)}
                  className="bg-luxe-gray border-luxe-silver text-white mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-luxe-gold" />
                  Versand pro Bestellung (€)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={shippingPerOrder}
                  onChange={(e) => setShippingPerOrder(e.target.value)}
                  className="bg-luxe-gray border-luxe-silver text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white">Ø Artikel pro Bestellung</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={itemsPerOrder}
                  onChange={(e) => setItemsPerOrder(e.target.value)}
                  className="bg-luxe-gray border-luxe-silver text-white mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-luxe-gold" />
                  Shop-Kosten pro Monat (€)
                </Label>
                <Input
                  type="number"
                  step="1"
                  value={shopMonthly}
                  onChange={(e) => setShopMonthly(e.target.value)}
                  placeholder="Hosting, Tools, etc."
                  className="bg-luxe-gray border-luxe-silver text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white">Erwartete Bestellungen / Monat</Label>
                <Input
                  type="number"
                  step="1"
                  value={ordersPerMonth}
                  onChange={(e) => setOrdersPerMonth(e.target.value)}
                  className="bg-luxe-gray border-luxe-silver text-white mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-luxe-gold" />
                Verpackung pro Artikel (€)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={packagingPerItem}
                onChange={(e) => setPackagingPerItem(e.target.value)}
                className="bg-luxe-gray border-luxe-silver text-white mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Produkt & Ergebnis</CardTitle>
            <p className="text-sm text-luxe-silver">
              Einkaufspreis eingeben oder ein Produkt wählen (nutzt gespeicherten Einkaufspreis).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {products.length > 0 && (
              <div>
                <Label className="text-white">Produkt auswählen (lädt Einkaufspreis)</Label>
                <select
                  value={selectedProduct || ''}
                  onChange={(e) => setSelectedProduct(e.target.value || null)}
                  className="w-full mt-1 px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white"
                >
                  <option value="">— Manuell eingeben —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.price} € · {CATEGORY_LABELS[p.category] || p.category})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {salesInfo && salesInfo.count > 0 && (
              <div className="p-3 rounded-lg bg-luxe-black/50 border border-luxe-silver/30">
                <p className="text-white text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-luxe-gold" />
                  Dieses Produkt: {salesInfo.count} {salesInfo.count === 1 ? 'Verkauf' : 'Verkäufe'} · Ø Verkaufspreis {round2(salesInfo.avgPrice).toFixed(2)} €
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Einkaufspreis (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="z. B. 15.00"
                  className="bg-luxe-gray border-luxe-silver text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white">Dein Verkaufspreis (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="z. B. 29.99"
                  className="bg-luxe-gray border-luxe-silver text-white mt-1"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-luxe-gray space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-luxe-black/50 border border-luxe-gold/30">
                <Info className="w-5 h-5 text-luxe-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Anteil pro Artikel (bei deinen Eingaben)</p>
                  <p className="text-luxe-silver text-sm mt-1">
                    Versand: {round2(shippingPerItem)} € · Shop: {round2(shopPerItem)} € · Verpackung: {packaging} €
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-luxe-gold/10 border border-luxe-gold/50">
                <p className="text-luxe-silver text-sm">Mindestverkaufspreis (Break-even)</p>
                <p className="text-2xl font-bold text-luxe-gold">
                  {cost > 0 ? `${breakEvenRounded.toFixed(2)} €` : '—'}
                </p>
                <p className="text-xs text-luxe-silver mt-1">
                  Darunter machst du Verlust (nach allen Kosten).
                </p>
              </div>

              {sell > 0 && (
                <div className={`p-4 rounded-lg border ${profitRounded >= 0 ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                  <p className="text-luxe-silver text-sm">Gewinn/Verlust bei {sell} € Verkaufspreis</p>
                  <p className={`text-2xl font-bold ${profitRounded >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profitRounded >= 0 ? '+' : ''}{profitRounded.toFixed(2)} €
                  </p>
                  <p className="text-xs text-luxe-silver mt-1">
                    Marge: {marginPercent} %
                  </p>
                </div>
              )}

              {similarStats && selectedProductData && cost > 0 && (
                <div className="p-4 rounded-lg bg-luxe-black/50 border border-luxe-gold/40">
                  <p className="text-white font-medium text-sm flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-luxe-gold" />
                    Ähnliche Produkte ({CATEGORY_LABELS[selectedProductData.category] || selectedProductData.category})
                  </p>
                  <p className="text-luxe-silver text-sm">
                    {similarStats.count} Produkt{similarStats.count !== 1 ? 'e' : ''} mit ähnlichem Preis: Min. {similarStats.min} € · Ø {similarStats.avg} € · Max. {similarStats.max} €
                  </p>
                  <p className="text-luxe-gold font-semibold mt-2 text-sm">
                    Empfehlung: Mindestens {Math.max(breakEvenRounded, similarStats.min).toFixed(2)} € verkaufen – damit liegst du im Rahmen der Kategorie und machst plus.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-luxe-silver">
        Einkaufspreis pro Produkt kannst du bei <Link href="/admin/products" className="text-luxe-gold hover:underline">Produkte bearbeiten</Link> unter „Einkaufspreis“ speichern – dann hier das Produkt auswählen.
      </p>
    </div>
  )
}
