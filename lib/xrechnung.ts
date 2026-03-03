/**
 * Phase 7.3: XRechnung / EN 16931 – UBL 2.1 XML-Generierung
 * Erzeugt elektronische Rechnungen im XRechnung-Format (E-Rechnung B2B-Pflicht ab 2025).
 * ZUGFeRD (PDF + eingebettetes XML) wird in lib/zugferd-embed.ts umgesetzt.
 */

import { getCompanyInfo } from '@/lib/company'
import { netFromGross, vatFromGross } from '@/lib/utils'

/** XML-Sonderzeichen escapen */
function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export interface XRechnungCustomerData {
  invoiceNumber: string
  issueDate: string
  orderNumber?: string
  customerName: string
  customerEmail: string
  billingAddress: {
    first_name?: string
    last_name?: string
    street?: string
    house_number?: string
    postal_code?: string
    city?: string
    country?: string
  }
  items: Array<{ product_name: string; quantity: number; price: number; total: number }>
  subtotal: number
  shippingCost: number
  discountAmount?: number
  total: number
  paymentMethod?: string
}

export interface XRechnungSelfBillingData {
  invoiceNumber: string
  issueDate: string
  orderId?: string
  vendorName: string
  vendorVatId: string | null
  netAmount: number
  taxRate: number
  grossAmount: number
  description?: string
}

function buildPartyInner(
  name: string,
  address: { street?: string; postal_code?: string; city?: string; country?: string },
  vatId: string | null,
  email?: string
): string {
  const street = [address.street].filter(Boolean).join(' ')
  const country = (address.country || 'DE').slice(0, 2)
  return `
      <cac:PartyIdentification><cbc:ID>${escapeXml(name.slice(0, 50))}</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${escapeXml(name)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(street || '-')}</cbc:StreetName>
        <cbc:CityName>${escapeXml(address.city || '-')}</cbc:CityName>
        <cbc:PostalZone>${escapeXml(address.postal_code || '')}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>${escapeXml(country)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      ${vatId ? `<cac:PartyTaxScheme><cbc:CompanyID>${escapeXml(vatId)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
      ${email ? `<cac:Contact><cbc:ElectronicMail>${escapeXml(email)}</cbc:ElectronicMail></cac:Contact>` : ''}`
}

/**
 * Erzeugt XRechnung UBL 2.1 XML für eine Kundenrechnung.
 */
export function generateXRechnungCustomerXml(data: XRechnungCustomerData): string {
  const company = getCompanyInfo()
  const buyerName = [
    data.billingAddress.first_name,
    data.billingAddress.last_name,
  ].filter(Boolean).join(' ') || data.customerName

  const netTotal = netFromGross(data.total)
  const vatTotal = vatFromGross(data.total)

  const invoiceLines = data.items.map((item, idx) => {
    const lineNet = netFromGross(item.total)
    const lineVat = vatFromGross(item.total)
    return `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="C62">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="EUR">${lineNet.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="EUR">${lineVat.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="EUR">${lineNet.toFixed(2)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="EUR">${lineVat.toFixed(2)}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>19</cbc:Percent>
            <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Description>${escapeXml(item.product_name)}</cbc:Description>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="EUR">${item.price.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`
  })

  if (data.shippingCost > 0) {
    const shipNet = netFromGross(data.shippingCost)
    const shipVat = vatFromGross(data.shippingCost)
    invoiceLines.push(`
    <cac:InvoiceLine>
      <cbc:ID>${data.items.length + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="EUR">${shipNet.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="EUR">${shipVat.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="EUR">${shipNet.toFixed(2)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="EUR">${shipVat.toFixed(2)}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>19</cbc:Percent>
            <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item><cbc:Description>Versandkosten</cbc:Description></cac:Item>
      <cac:Price><cbc:PriceAmount currencyID="EUR">${data.shippingCost.toFixed(2)}</cbc:PriceAmount></cac:Price>
    </cac:InvoiceLine>`)
  }

  const sellerAddress = {
    street: company.address,
    postal_code: company.postalCode,
    city: company.city,
    country: company.country === 'Deutschland' ? 'DE' : 'DE',
  }

  const buyerAddress = {
    street: [data.billingAddress.street, data.billingAddress.house_number].filter(Boolean).join(' '),
    postal_code: data.billingAddress.postal_code || '',
    city: data.billingAddress.city || '',
    country: (data.billingAddress.country || 'Deutschland').slice(0, 2) === 'De' ? 'DE' : (data.billingAddress.country || 'DE').slice(0, 2),
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID>
  <cbc:ID>${escapeXml(data.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  ${data.orderNumber ? `<cac:OrderReference><cbc:ID>${escapeXml(data.orderNumber)}</cbc:ID></cac:OrderReference>` : ''}
  <cac:AccountingSupplierParty>
    <cac:Party>${buildPartyInner(company.name, sellerAddress, company.vatId, company.email)}
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>${buildPartyInner(buyerName, buyerAddress, null, data.customerEmail)}
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cbc:PaymentDueDate>${data.issueDate}</cbc:PaymentDueDate>
    <cac:PaymentTerms>
      <cbc:Note>Zahlbar bei Erhalt</cbc:Note>
    </cac:PaymentTerms>
  </cac:PaymentMeans>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${vatTotal.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">${netTotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">${vatTotal.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>19</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${netTotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${netTotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${data.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${data.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${invoiceLines.join('\n')}
</Invoice>`

  return xml
}

/**
 * Erzeugt XRechnung UBL 2.1 XML für eine Self-Billing Gutschrift (§14 UStG).
 */
export function generateXRechnungSelfBillingXml(data: XRechnungSelfBillingData): string {
  const company = getCompanyInfo()
  const netAmount = data.netAmount
  const vatAmount = Math.round((data.grossAmount - data.netAmount) * 100) / 100

  const sellerAddress = {
    street: company.address,
    postal_code: company.postalCode,
    city: company.city,
    country: 'DE',
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID>
  <cbc:ID>${escapeXml(data.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>381</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>${buildPartyInner(company.name, sellerAddress, company.vatId, company.email)}
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>${buildPartyInner(data.vendorName, { street: '', postal_code: '', city: '', country: 'DE' }, data.vendorVatId)}
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${vatAmount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">${netAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">${vatAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${data.taxRate}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${netAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${netAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${data.grossAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${data.grossAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${netAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="EUR">${vatAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="EUR">${netAmount.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="EUR">${vatAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${data.taxRate}</cbc:Percent>
          <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item><cbc:Description>${escapeXml(data.description || 'Self-Billing Gutschrift §14 UStG')}</cbc:Description></cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="EUR">${netAmount.toFixed(2)}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>
</Invoice>`
}
