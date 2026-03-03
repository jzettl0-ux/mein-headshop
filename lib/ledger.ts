/**
 * Phase 7.1: Financials Ledger – Buchungen bei Verkauf.
 * Schreibt SALE, COMMISSION_FEE, PAYOUT in financials.ledger bei Zahlungseingang.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getDestinationCountryCode, isDeemedSupplierApplicable } from '@/lib/eu-vat'

const DEFAULT_COMMISSION_PERCENT = 15

interface OrderLine {
  id: string
  vendor_id: string | null
  seller_type: string
  subtotal: number
}

interface OrderRow {
  id: string
  subtotal: number
  shipping_cost: number
}

interface LedgerOrderContext {
  shipping_address?: { country?: string } | null
  billing_address?: { country?: string } | null
  buyer_vat_id?: string | null
  destination_country?: string
}

/**
 * Erstellt Ledger-Buchungen für eine bezahlte Bestellung.
 * Idempotent: prüft, ob bereits Einträge für diese Bestellung existieren.
 * Phase 7.4: Setzt is_deemed_supplier bei B2C EU-Grenzüberschreitung (Deemed Seller).
 */
export async function insertLedgerEntriesForOrder(
  admin: SupabaseClient,
  orderId: string,
  order: OrderRow,
  context?: LedgerOrderContext
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { count } = await admin
      .schema('financials')
      .from('ledger')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId)
      .in('transaction_type', ['SALE', 'COMMISSION_FEE', 'PAYOUT', 'SHIPPING_FEE'])

    if ((count ?? 0) > 0) {
      return { ok: true }
    }

    const { data: lines, error: linesError } = await admin
      .schema('fulfillment')
      .from('order_lines')
      .select('id, vendor_id, seller_type, subtotal')
      .eq('order_id', orderId)

    if (linesError) {
      console.warn('ledger: order_lines load error', linesError.message)
      return { ok: false, error: linesError.message }
    }

    const destCountry = context?.destination_country ?? getDestinationCountryCode(context?.shipping_address)
    const deemedSupplier = isDeemedSupplierApplicable({
      destinationCountry: destCountry,
      orderTotal: Number(order.subtotal) + Number(order.shipping_cost),
      buyerVatId: context?.buyer_vat_id,
    })

    const entries: Array<{
      order_id: string
      vendor_id: string | null
      transaction_type: string
      amount: number
      description: string | null
      is_deemed_supplier?: boolean
    }> = []

    const orderSubtotal = Number(order.subtotal) ?? 0
    const shippingCost = Number(order.shipping_cost) ?? 0

    if (!lines?.length) {
      entries.push({
        order_id: orderId,
        vendor_id: null,
        transaction_type: 'SALE',
        amount: orderSubtotal + shippingCost,
        description: 'Shop-Umsatz (keine Order Lines)',
        ...(deemedSupplier && { is_deemed_supplier: true }),
      })
    } else {
      for (const line of lines as OrderLine[]) {
        const subtotal = Math.round(Number(line.subtotal ?? 0) * 100) / 100
        if (subtotal <= 0) continue

        if (line.seller_type === 'shop' || !line.vendor_id) {
          entries.push({
            order_id: orderId,
            vendor_id: null,
            transaction_type: 'SALE',
            amount: subtotal,
            description: 'Shop-Umsatz',
            ...(deemedSupplier && { is_deemed_supplier: true }),
          })
          continue
        }

        const commissionPercent = DEFAULT_COMMISSION_PERCENT
        const commissionEur = Math.round((subtotal * commissionPercent) / 100 * 100) / 100
        const netToVendor = Math.round((subtotal - commissionEur) * 100) / 100

        entries.push({
          order_id: orderId,
          vendor_id: line.vendor_id,
          transaction_type: 'SALE',
          amount: subtotal,
          description: 'Vendor-Umsatz',
          ...(deemedSupplier && { is_deemed_supplier: true }),
        })
        if (commissionEur > 0) {
          entries.push({
            order_id: orderId,
            vendor_id: line.vendor_id,
            transaction_type: 'COMMISSION_FEE',
            amount: commissionEur,
            description: 'Marktplatzprovision',
          })
        }
        if (netToVendor > 0) {
          entries.push({
            order_id: orderId,
            vendor_id: line.vendor_id,
            transaction_type: 'PAYOUT',
            amount: netToVendor,
            description: 'Vendor-Auszahlung',
          })
        }
      }

      if (shippingCost > 0) {
        entries.push({
          order_id: orderId,
          vendor_id: null,
          transaction_type: 'SHIPPING_FEE',
          amount: shippingCost,
          description: 'Versandkosten',
        })
      }
    }

    const { error: insertError } = await admin.schema('financials').from('ledger').insert(
      entries.map((e) => ({
        order_id: e.order_id,
        vendor_id: e.vendor_id,
        transaction_type: e.transaction_type,
        amount: e.amount,
        description: e.description,
        ...(e.is_deemed_supplier && { is_deemed_supplier: true }),
      }))
    )

    if (insertError) {
      console.warn('ledger: insert error', insertError.message)
      return { ok: false, error: insertError.message }
    }

    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('ledger: insertLedgerEntriesForOrder error', msg)
    return { ok: false, error: msg }
  }
}
