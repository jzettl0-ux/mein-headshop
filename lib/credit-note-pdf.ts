import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getCompanyInfo } from './company'

const FONT_SIZE = 10
const FONT_SIZE_SMALL = 8
const MARGIN = 50
const LINE_HEIGHT = 14

export interface CreditNoteData {
  order_number: string
  credit_note_number: string
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
  amount_eur: number
  reason?: string
}

export interface CreditNotePdfOptions {
  logoUrl?: string
}

/**
 * Erzeugt eine Gutschrift (PDF) zur ursprünglichen Rechnung.
 */
export async function generateCreditNotePdf(
  data: CreditNoteData,
  options?: CreditNotePdfOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842])
  const { width, height } = page.getSize()
  let y = height - MARGIN

  const company = getCompanyInfo()
  const write = (text: string, opts?: { bold?: boolean; small?: boolean }) => {
    const f = opts?.bold ? fontBold : font
    const size = opts?.small ? FONT_SIZE_SMALL : FONT_SIZE
    page.drawText(text, { x: MARGIN, y, size, font: f, color: rgb(0, 0, 0) })
    y -= LINE_HEIGHT * (opts?.small ? 0.9 : 1)
  }
  const writeRight = (text: string, rightEdge: number) => {
    const size = FONT_SIZE
    const textWidth = fontBold.widthOfTextAtSize(text, size)
    page.drawText(text, { x: Math.max(MARGIN, rightEdge - textWidth), y, size, font: fontBold, color: rgb(0, 0, 0) })
    y -= LINE_HEIGHT
  }

  write(company.name, { bold: true })
  write(`${company.address}, ${company.postalCode} ${company.city}`)
  write(company.country)
  if (company.vatId) write(`USt-IdNr.: ${company.vatId}`, { small: true })
  y -= LINE_HEIGHT
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.3, color: rgb(0.9, 0.9, 0.9) })
  y -= LINE_HEIGHT

  const rightEdge = width - MARGIN
  page.drawText('GUTSCHRIFT', { x: rightEdge - fontBold.widthOfTextAtSize('GUTSCHRIFT', 18), y, size: 18, font: fontBold, color: rgb(0, 0, 0) })
  y -= LINE_HEIGHT * 1.5

  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  writeRight(`Gutschrift-Nr.: ${data.credit_note_number}`, rightEdge)
  writeRight(`Datum: ${today}`, rightEdge)
  writeRight(`Storniert: Rechnung ${data.order_number}`, rightEdge)
  y -= LINE_HEIGHT
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) })
  y -= LINE_HEIGHT * 1.5

  write('Kunde:', { bold: true })
  const ba = data.billing_address
  const buyerName = [ba.first_name, ba.last_name].filter(Boolean).join(' ') || data.customer_name
  write(buyerName)
  write([ba.street, ba.house_number].filter(Boolean).join(' ') || '-')
  write(`${ba.postal_code || ''} ${ba.city || ''}`.trim() || '-')
  write((ba.country as string) || 'Deutschland')
  write(data.customer_email, { small: true })
  y -= LINE_HEIGHT

  write('Gutschriftbetrag (brutto)', { bold: true })
  write(`- ${data.amount_eur.toFixed(2)} €`)
  if (data.reason) write(`Grund: ${data.reason}`, { small: true })
  y -= LINE_HEIGHT * 2
  write('Diese Gutschrift wurde elektronisch erstellt und ist ohne Unterschrift gültig.', { small: true })
  if (company.vatId) write('USt-IdNr. § 27a UStG: ' + company.vatId, { small: true })

  return doc.save()
}
