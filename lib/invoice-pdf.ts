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

export interface InvoicePdfOptions {
  /** Logo-URL (öffentlich erreichbar), wird oben links eingebunden */
  logoUrl?: string
}

async function embedLogoImage(doc: PDFDocument, logoUrl: string): Promise<{ image: Awaited<ReturnType<PDFDocument['embedPng']>>; width: number; height: number } | null> {
  try {
    const res = await fetch(logoUrl, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const bytes = new Uint8Array(buf)
    const contentType = res.headers.get('content-type') || ''
    let image: Awaited<ReturnType<PDFDocument['embedPng']>>
    if (contentType.includes('png') || logoUrl.toLowerCase().endsWith('.png')) {
      image = await doc.embedPng(bytes)
    } else {
      image = await doc.embedJpg(bytes)
    }
    const w = image.width
    const h = image.height
    const maxH = 44
    const scale = h > maxH ? maxH / h : 1
    return { image, width: w * scale, height: h * scale }
  } catch {
    return null
  }
}

/**
 * Erzeugt eine rechtskonforme Rechnung (PDF) gemäß §14 UStG.
 * Nur Pflichtangaben: Verkäufer/Empfänger, USt-IdNr., Datum, Rechnungsnummer, Menge/Art, Netto/Steuer/Gesamt, Zahlungsart.
 */
export async function generateInvoicePdf(data: InvoiceOrderData, options?: InvoicePdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842])
  const { width, height } = page.getSize()
  let y = height - MARGIN

  const company = getCompanyInfo()

  // Logo oben links (falls vorhanden)
  const logoMaxWidth = 140
  let companyStartX = MARGIN
  if (options?.logoUrl?.trim()) {
    const logoResult = await embedLogoImage(doc, options.logoUrl.trim())
    if (logoResult) {
      const drawW = Math.min(logoResult.width, logoMaxWidth)
      const drawH = (logoResult.height / logoResult.width) * drawW
      page.drawImage(logoResult.image, { x: MARGIN, y: y - drawH, width: drawW, height: drawH })
      companyStartX = MARGIN + drawW + 16
      y -= drawH + LINE_HEIGHT
    }
  }

  const write = (text: string, opts?: { bold?: boolean; small?: boolean; x?: number }) => {
    const x = opts?.x ?? MARGIN
    const f = opts?.bold ? fontBold : font
    const size = opts?.small ? FONT_SIZE_SMALL : FONT_SIZE
    page.drawText(text, { x, y, size, font: f, color: rgb(0, 0, 0) })
    y -= LINE_HEIGHT * (opts?.small ? 0.9 : 1)
  }

  const writeAt = (text: string, x: number, opts?: { bold?: boolean; small?: boolean }) => {
    const f = opts?.bold ? fontBold : font
    const size = opts?.small ? FONT_SIZE_SMALL : FONT_SIZE
    page.drawText(text, { x, y, size, font: f, color: rgb(0, 0, 0) })
    y -= LINE_HEIGHT * (opts?.small ? 0.9 : 1)
  }

  /** Zeile rechtsbündig zeichnen (Ende der Zeile am rechten Rand), damit lange Texte nicht aus dem Blatt laufen */
  const writeRightAligned = (text: string, rightEdge: number, opts?: { bold?: boolean; small?: boolean }) => {
    const f = opts?.bold ? fontBold : font
    const size = opts?.small ? FONT_SIZE_SMALL : FONT_SIZE
    const textWidth = f.widthOfTextAtSize(text, size)
    const x = Math.max(MARGIN, rightEdge - textWidth)
    page.drawText(text, { x, y, size, font: f, color: rgb(0, 0, 0) })
    y -= LINE_HEIGHT * (opts?.small ? 0.9 : 1)
  }

  // Verkäufer (links bzw. neben Logo)
  writeAt(company.name, companyStartX, { bold: true })
  writeAt(`${company.address}, ${company.postalCode} ${company.city}`, companyStartX)
  writeAt(company.country, companyStartX)
  if (company.vatId) writeAt(`USt-IdNr.: ${company.vatId}`, companyStartX, { small: true })
  writeAt(company.email, companyStartX, { small: true })
  if (company.phone) writeAt(company.phone, companyStartX, { small: true })

  y -= LINE_HEIGHT
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.3, color: rgb(0.9, 0.9, 0.9) })
  y -= LINE_HEIGHT
  const rightEdge = width - MARGIN
  const titleWidth = fontBold.widthOfTextAtSize('RECHNUNG', 18)
  page.drawText('RECHNUNG', { x: rightEdge - titleWidth, y, size: 18, font: fontBold, color: rgb(0, 0, 0) })
  y -= LINE_HEIGHT * 1.5

  // Rechnungsnummer & Datum rechtsbündig, damit lange Nummern nicht aus dem Blatt laufen
  const invoiceDate = new Date(data.created_at).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const invoiceNumber = (data.order_number || '').trim() || '–'
  writeRightAligned(`Rechnungsnummer: ${invoiceNumber}`, rightEdge)
  writeRightAligned(`Rechnungsdatum: ${invoiceDate}`, rightEdge)
  writeRightAligned(`Leistungsdatum: ${invoiceDate}`, rightEdge)
  y -= LINE_HEIGHT * 0.5
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) })
  y -= LINE_HEIGHT * 1.5

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
  row('Summe netto', `${netTotal.toFixed(2)} €`)
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
  drawLine('Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig.', { small: true })
  if (company.vatId) {
    drawLine('USt-IdNr. § 27a UStG: ' + company.vatId, { small: true })
  }
  drawLine('Widerrufsrecht: 14 Tage ohne Angabe von Gründen. Details in unseren AGB.', { small: true })

  const pdfBytes = await doc.save()
  return pdfBytes
}
