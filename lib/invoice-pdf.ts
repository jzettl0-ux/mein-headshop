import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getCompanyInfo } from './company'

const FONT_SIZE = 10
const FONT_SIZE_SMALL = 8
const MARGIN = 50
const LINE_HEIGHT = 14

/** Brutto → Netto (19 % MwSt.) */
function netFromGross(gross: number): number {
  return Math.round((gross / 1.19) * 100) / 100
}

/** Brutto → MwSt.-Betrag (19 %) */
function vatFromGross(gross: number): number {
  return Math.round((gross - gross / 1.19) * 100) / 100
}

export interface InvoiceOrderData {
  order_number: string
  created_at: string
  customer_name: string
  customer_email: string
  billing_address: {
    first_name?: string
    last_name?: string
    street?: string
    house_number?: string
    postal_code?: string
    city?: string
    country?: string
  }
  shipping_address?: unknown
  payment_method: string
  items: Array<{ product_name: string; quantity: number; price: number; total: number }>
  subtotal: number
  shipping_cost: number
  discount_amount?: number
  total: number
  has_adult_items?: boolean
}

/**
 * Erzeugt eine rechtskonforme Rechnung (PDF) gemäß §14 UStG.
 * Enthält: Rechnungsnummer, Datum, Verkäufer/Käufer, Positionen mit MwSt., Steuerbetrag, Gesamt, Zahlungsart, Hinweise.
 */
export async function generateInvoicePdf(data: InvoiceOrderData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842])
  const { width, height } = page.getSize()
  let y = height - MARGIN

  const company = getCompanyInfo()

  const write = (text: string, opts?: { bold?: boolean; small?: boolean; x?: number }) => {
    const x = opts?.x ?? MARGIN
    const f = opts?.bold ? fontBold : font
    const size = opts?.small ? FONT_SIZE_SMALL : FONT_SIZE
    page.drawText(text, { x, y, size, font: f, color: rgb(0, 0, 0) })
    y -= LINE_HEIGHT * (opts?.small ? 0.9 : 1)
  }

  // —— Kopf: Verkäufer (links), Rechnungstitel (rechts) ——
  write(company.name, { bold: true })
  write(`${company.address}, ${company.postalCode} ${company.city}`)
  write(company.country)
  if (company.vatId) write(`USt-IdNr.: ${company.vatId}`, { small: true })
  write(company.email, { small: true })
  if (company.phone) write(company.phone, { small: true })

  y -= LINE_HEIGHT
  const invoiceTitleX = width - MARGIN - 120
  page.drawText('RECHNUNG', { x: invoiceTitleX, y, size: 18, font: fontBold, color: rgb(0, 0, 0) })
  y -= LINE_HEIGHT * 1.5

  // Rechnungsnummer & Datum
  const invoiceDate = new Date(data.created_at).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  write(`Rechnungsnummer: ${data.order_number}`, { x: invoiceTitleX })
  write(`Rechnungsdatum: ${invoiceDate}`, { x: invoiceTitleX })
  write(`Leistungsdatum: ${invoiceDate}`, { x: invoiceTitleX })
  y -= LINE_HEIGHT

  // —— Rechnungsempfänger (Käufer) ——
  y -= LINE_HEIGHT
  write('Rechnungsempfänger:', { bold: true })
  const ba = data.billing_address
  const buyerName = [ba.first_name, ba.last_name].filter(Boolean).join(' ') || data.customer_name
  write(buyerName)
  write([ba.street, ba.house_number].filter(Boolean).join(' ') || '-')
  write(`${ba.postal_code || ''} ${ba.city || ''}`.trim() || '-')
  write((ba.country as string) || 'Deutschland')
  write(data.customer_email, { small: true })
  y -= LINE_HEIGHT * 1.5

  // —— Positionen (Artikel, Menge, Einzelpreis, Gesamt) – alle Preise Brutto, MwSt. 19 % ——
  write('Positionen', { bold: true })
  const thY = y
  page.drawText('Artikel', { x: MARGIN, y: thY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0, 0, 0) })
  page.drawText('Menge', { x: width - MARGIN - 220, y: thY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0, 0, 0) })
  page.drawText('Einzelpreis', { x: width - MARGIN - 150, y: thY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0, 0, 0) })
  page.drawText('Gesamt', { x: width - MARGIN - 70, y: thY, size: FONT_SIZE_SMALL, font: fontBold, color: rgb(0, 0, 0) })
  y -= LINE_HEIGHT

  for (const item of data.items) {
    if (y < 200) {
      const newPage = doc.addPage([595, 842])
      y = newPage.getSize().height - MARGIN
    }
    const pageRef = doc.getPages().length - 1
    const currentPage = doc.getPage(pageRef)
    const productName = item.product_name.length > 45 ? item.product_name.slice(0, 42) + '…' : item.product_name
    currentPage.drawText(productName, { x: MARGIN, y, size: FONT_SIZE_SMALL, font, color: rgb(0, 0, 0) })
    currentPage.drawText(String(item.quantity), { x: width - MARGIN - 220, y, size: FONT_SIZE_SMALL, font, color: rgb(0, 0, 0) })
    currentPage.drawText(`${item.price.toFixed(2)} €`, { x: width - MARGIN - 150, y, size: FONT_SIZE_SMALL, font, color: rgb(0, 0, 0) })
    currentPage.drawText(`${(item.total).toFixed(2)} €`, { x: width - MARGIN - 70, y, size: FONT_SIZE_SMALL, font, color: rgb(0, 0, 0) })
    y -= LINE_HEIGHT
  }

  y -= LINE_HEIGHT
  const discountAmount = Number(data.discount_amount) || 0
  const netTotal = netFromGross(data.total)
  const vatTotal = vatFromGross(data.total)

  const row = (label: string, value: string) => {
    if (y < 180) {
      const newPage = doc.addPage([595, 842])
      y = newPage.getSize().height - MARGIN
    }
    const p = doc.getPages()[doc.getPages().length - 1]
    p.drawText(label, { x: MARGIN, y, size: FONT_SIZE_SMALL, font, color: rgb(0, 0, 0) })
    p.drawText(value, { x: width - MARGIN - 70, y, size: FONT_SIZE_SMALL, font, color: rgb(0, 0, 0) })
    y -= LINE_HEIGHT
  }

  row('Zwischensumme (brutto)', `${data.subtotal.toFixed(2)} €`)
  row('Versandkosten (brutto)', `${data.shipping_cost.toFixed(2)} €`)
  if (discountAmount > 0) row('Rabatt (brutto)', `- ${discountAmount.toFixed(2)} €`)
  row('Summe netto (z. B. 19 % MwSt.)', `${netTotal.toFixed(2)} €`)
  row('Enthaltene MwSt. 19 %', `${vatTotal.toFixed(2)} €`)
  row('Gesamtbetrag (brutto)', `${data.total.toFixed(2)} €`)
  y -= LINE_HEIGHT

  const lastPage = () => doc.getPages()[doc.getPages().length - 1]
  const drawLine = (text: string, opts?: { bold?: boolean; small?: boolean }) => {
    if (y < 120) {
      const newPage = doc.addPage([595, 842])
      y = newPage.getSize().height - MARGIN
    }
    const p = lastPage()
    const f = opts?.bold ? fontBold : font
    const size = opts?.small ? FONT_SIZE_SMALL : FONT_SIZE
    p.drawText(text, { x: MARGIN, y, size, font: f, color: rgb(0, 0, 0) })
    y -= LINE_HEIGHT * (opts?.small ? 0.9 : 1)
  }

  drawLine(`Zahlungsart: ${data.payment_method === 'mollie' ? 'Online-Zahlung (Mollie)' : data.payment_method}`)
  y -= 4
  drawLine('Rechtliche Hinweise', { bold: true })
  drawLine('Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum. Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig.', { small: true })
  if (company.vatId) {
    drawLine('Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: ' + company.vatId, { small: true })
  }
  drawLine('Widerrufsrecht: Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.', { small: true })
  drawLine('Weitere Informationen zu Widerruf und Rückgabe finden Sie in unseren AGB auf der Website.', { small: true })

  const pdfBytes = await doc.save()
  return pdfBytes
}
