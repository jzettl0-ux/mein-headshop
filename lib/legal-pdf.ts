import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getCompanyInfo } from './company'

const FONT_SIZE = 10
const FONT_TITLE = 16
const FONT_HEADING = 12
const MARGIN = 50
const LINE_HEIGHT = 14

function wrapText(text: string, maxWidth: number, font: { widthOfTextAtSize: (t: string, s: number) => number }): string[] {
  const lines: string[] = []
  const words = text.replace(/\s+/g, ' ').split(' ')
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(test, FONT_SIZE) <= maxWidth) {
      line = test
    } else {
      if (line) lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function generateAgbPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842])
  const { width, height } = page.getSize()
  const maxWidth = width - 2 * MARGIN
  let y = height - MARGIN

  const company = getCompanyInfo()

  const drawText = (str: string, opts?: { bold?: boolean }) => {
    const f = opts?.bold ? fontBold : font
    const size = opts?.bold ? FONT_HEADING : FONT_SIZE
    const lines = wrapText(str, maxWidth, f)
    for (const line of lines) {
      page.drawText(line, { x: MARGIN, y, size, font: f, color: rgb(0.9, 0.9, 0.9) })
      y -= LINE_HEIGHT
    }
  }

  page.drawText('Allgemeine Geschäftsbedingungen (AGB)', {
    x: MARGIN,
    y,
    size: FONT_TITLE,
    font: fontBold,
    color: rgb(1, 1, 1),
  })
  y -= LINE_HEIGHT * 2

  drawText(`${company.name} | ${company.address}, ${company.postalCode} ${company.city}`)
  drawText(`Stand: ${new Date().toLocaleDateString('de-DE')}`)
  y -= LINE_HEIGHT * 2

  const sections = [
    { title: '§ 1 Geltungsbereich & Altersbeschränkung', body: 'Diese AGB gelten für alle Verträge zwischen dem Verkäufer und dem Kunden. Der Verkauf richtet sich ausschließlich an Personen über 18 Jahre. Mit der Bestellung bestätigt der Kunde, mindestens 18 Jahre alt zu sein.' },
    { title: '§ 2 Vertragsschluss', body: 'Die Darstellung im Shop ist kein bindendes Angebot. Durch "Zahlungspflichtig bestellen" gibt der Kunde ein bindendes Angebot ab. Die Bestätigungs-E-Mail ist die Annahme.' },
    { title: '§ 3 Preise und Versand', body: 'Preise inkl. MwSt. Versandkosten 4,90 €, ab 50 € bestellwert versandkostenfrei. Bei 18+ Produkten fallen 2,00 € DHL Alterssichtprüfung an.' },
    { title: '§ 4 Lieferung', body: 'Lieferung in Deutschland, 2-5 Werktage. Bei Nichtverfügbarkeit informieren wir unverzüglich.' },
    { title: '§ 5 Widerrufsrecht', body: 'Verbrauchern steht ein Widerrufsrecht zu. Die Widerrufsfrist beträgt 14 Tage ab Erhalt der Ware. Details in der Widerrufsbelehrung.' },
  ]

  for (const s of sections) {
    drawText(s.title, { bold: true })
    y -= 4
    drawText(s.body)
    y -= LINE_HEIGHT
  }

  const pdfBytes = await doc.save()
  return new Uint8Array(pdfBytes)
}

export async function generateWiderrufPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842])
  const { width, height } = page.getSize()
  const maxWidth = width - 2 * MARGIN
  let y = height - MARGIN

  const company = getCompanyInfo()

  const drawText = (str: string, opts?: { bold?: boolean }) => {
    const f = opts?.bold ? fontBold : font
    const size = opts?.bold ? FONT_HEADING : FONT_SIZE
    const lines = wrapText(str, maxWidth, f)
    for (const line of lines) {
      page.drawText(line, { x: MARGIN, y, size, font: f, color: rgb(0.9, 0.9, 0.9) })
      y -= LINE_HEIGHT
    }
  }

  page.drawText('Widerrufsbelehrung', {
    x: MARGIN,
    y,
    size: FONT_TITLE,
    font: fontBold,
    color: rgb(1, 1, 1),
  })
  y -= LINE_HEIGHT * 2

  drawText(`Widerrufsrecht: Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.`)
  drawText(`Widerrufsfrist: 14 Tage ab dem Tag, an dem Sie die Waren in Besitz genommen haben.`)
  drawText(`Ausübung: Mitteilung an uns per E-Mail oder Brief. Kontakt: ${company.name}, ${company.address}, ${company.postalCode} ${company.city}, E-Mail: ${company.email}.`)
  drawText(`Rücksendung: Unverzüglich, spätestens binnen 14 Tagen nach Widerrufsmitteilung. Sie tragen die unmittelbaren Kosten der Rücksendung.`)
  drawText(`Rückzahlung: Wir erstatten alle Zahlungen binnen 14 Tagen nach Eingang Ihrer Widerrufsmitteilung.`)
  drawText(`Stand: ${new Date().toLocaleDateString('de-DE')} | ${company.name}`)

  const pdfBytes = await doc.save()
  return new Uint8Array(pdfBytes)
}

/** Platzhalter für Mitarbeitervertrag: {{key}} durch Werte ersetzen */
export function replaceContractPlaceholders(
  template: string,
  placeholders: Record<string, string>
): string {
  let out = template
  for (const [key, value] of Object.entries(placeholders)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return out
}

/** PDF aus Vertragstext erzeugen (mit Umbruch und neuer Seite bei Platzmangel) */
export async function generateEmployeeContractPdf(
  template: string,
  placeholders: Record<string, string> = {}
): Promise<Uint8Array> {
  const text = replaceContractPlaceholders(template, placeholders)
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  let page = doc.addPage([595, 842])
  let { width, height } = page.getSize()
  const maxWidth = width - 2 * MARGIN
  let y = height - MARGIN

  const drawText = (str: string, opts?: { bold?: boolean }) => {
    const f = opts?.bold ? fontBold : font
    const size = opts?.bold ? FONT_HEADING : FONT_SIZE
    const lines = wrapText(str, maxWidth, f)
    for (const line of lines) {
      if (y < MARGIN + LINE_HEIGHT) {
        page = doc.addPage([595, 842])
        const sz = page.getSize()
        width = sz.width
        height = sz.height
        y = height - MARGIN
      }
      page.drawText(line, { x: MARGIN, y, size, font: f, color: rgb(0.2, 0.2, 0.2) })
      y -= LINE_HEIGHT
    }
  }

  const paragraphs = text.split(/\n+/)
  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) {
      y -= LINE_HEIGHT
      continue
    }
    const isHeading = /^§\s*\d|^[A-ZÄÖÜ][a-zäöüß\s]+:$/.test(trimmed) || trimmed.length < 60
    drawText(trimmed, { bold: !!isHeading })
  }

  const pdfBytes = await doc.save()
  return new Uint8Array(pdfBytes)
}
