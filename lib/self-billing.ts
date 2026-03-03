/**
 * Phase 7.2 + 7.3: Self-Billing Gutschriften (§14 UStG) + XRechnung XML
 * Erstellt SELF_BILLING_CREDIT_NOTE-Einträge in financials.invoices für PAYOUT-Ledger-Buchungen.
 * Generiert XRechnung XML und speichert in Storage (e_invoice_xml_url).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getCompanyInfo } from '@/lib/company'
import { generateXRechnungSelfBillingXml } from '@/lib/xrechnung'
import { VAT_RATE_PERCENT } from '@/lib/utils'

const TAX_RATE = VAT_RATE_PERCENT / 100

/**
 * Erzeugt Self-Billing Gutschriften für alle PAYOUT-Ledger-Einträge einer Bestellung.
 * Idempotent: prüft, ob bereits Gutschriften für diese order_id existieren.
 */
export async function createSelfBillingCreditNotesForOrder(
  admin: SupabaseClient,
  orderId: string
): Promise<{ ok: boolean; count: number; error?: string }> {
  try {
    const { count: existing } = await admin
      .schema('financials')
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId)
      .eq('document_type', 'SELF_BILLING_CREDIT_NOTE')

    if ((existing ?? 0) > 0) {
      return { ok: true, count: existing ?? 0 }
    }

    const { data: payouts, error: payoutsError } = await admin
      .schema('financials')
      .from('ledger')
      .select('transaction_id, vendor_id, amount, description')
      .eq('order_id', orderId)
      .eq('transaction_type', 'PAYOUT')

    if (payoutsError || !payouts?.length) {
      return { ok: true, count: 0 }
    }

    const vendorIds = [...new Set(payouts.map((p) => p.vendor_id).filter(Boolean))] as string[]

    let vendorMap: Record<string, { vat_id: string | null; company_name: string }> = {}
    if (vendorIds.length > 0) {
      const { data: vendors } = await admin
        .from('vendor_accounts')
        .select('id, vat_id, company_name')
        .in('id', vendorIds)
      for (const v of vendors ?? []) {
        vendorMap[v.id] = { vat_id: v.vat_id ?? null, company_name: v.company_name || 'Vendor' }
      }
    }

    const company = getCompanyInfo()
    const TAX_RATE = 0.19
    const invoices: Array<{
      transaction_id: string
      order_id: string
      vendor_id: string
      invoice_number: string
      document_type: string
      seller_vat_id: string | null
      buyer_vat_id: string | null
      net_amount: number
      tax_rate: number
      gross_amount: number
    }> = []

    for (const p of payouts) {
      const vendorId = p.vendor_id
      if (!vendorId) continue

      const netAmount = Math.round(Number(p.amount) * 100) / 100
      if (netAmount <= 0) continue

      let seqVal: number | null = null
      try {
        const res = await admin.rpc('get_next_self_billing_number').single()
        seqVal = res.data as number | null
      } catch { /* ignore */ }
      const seq = typeof seqVal === 'number' ? seqVal : 1
      const year = new Date().getFullYear()
      const invoiceNumber = `SB-${year}-${String(seq).padStart(6, '0')}`

      const taxRate = TAX_RATE * 100
      const grossAmount = Math.round(netAmount * (1 + TAX_RATE) * 100) / 100

      invoices.push({
        transaction_id: p.transaction_id,
        order_id: orderId,
        vendor_id: vendorId,
        invoice_number: invoiceNumber,
        document_type: 'SELF_BILLING_CREDIT_NOTE',
        seller_vat_id: company.vatId,
        buyer_vat_id: vendorMap[vendorId]?.vat_id ?? null,
        net_amount: netAmount,
        tax_rate: taxRate,
        gross_amount: grossAmount,
      })
    }

    if (invoices.length === 0) {
      return { ok: true, count: 0 }
    }

    const { data: inserted, error: insertErr } = await admin
      .schema('financials')
      .from('invoices')
      .insert(
        invoices.map((inv) => ({
          transaction_id: inv.transaction_id,
          order_id: inv.order_id,
          vendor_id: inv.vendor_id,
          invoice_number: inv.invoice_number,
          document_type: inv.document_type,
          seller_vat_id: inv.seller_vat_id,
          buyer_vat_id: inv.buyer_vat_id,
          net_amount: inv.net_amount,
          tax_rate: inv.tax_rate,
          gross_amount: inv.gross_amount,
        }))
      )
      .select('invoice_id, invoice_number, vendor_id, net_amount, tax_rate, gross_amount')

    if (insertErr) {
      return { ok: false, count: 0, error: insertErr.message }
    }

    // Phase 7.3: XRechnung XML erzeugen, in Storage speichern, e_invoice_xml_url setzen
    const issueDate = new Date().toISOString().slice(0, 10)
    for (let i = 0; i < (inserted?.length ?? 0); i++) {
      const row = inserted![i]
      const inv = invoices[i]
      if (!inv || !row) continue
      try {
        const xml = generateXRechnungSelfBillingXml({
          invoiceNumber: inv.invoice_number,
          issueDate,
          vendorName: vendorMap[inv.vendor_id]?.company_name ?? 'Vendor',
          vendorVatId: inv.buyer_vat_id,
          netAmount: inv.net_amount,
          taxRate: inv.tax_rate,
          grossAmount: inv.gross_amount,
          description: 'Self-Billing Gutschrift §14 UStG',
        })
        const xmlFileName = `xrechnung-${inv.invoice_number}.xml`
        const { error: xmlErr } = await admin.storage
          .from('invoices')
          .upload(xmlFileName, Buffer.from(xml, 'utf-8'), { contentType: 'application/xml', upsert: true })
        if (!xmlErr) {
          await admin.schema('financials').from('invoices').update({ e_invoice_xml_url: xmlFileName }).eq('invoice_id', row.invoice_id)
        }
      } catch (_) {
        /* ignore per-invoice XML errors */
      }
    }

    return { ok: true, count: invoices.length }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, count: 0, error: msg }
  }
}
