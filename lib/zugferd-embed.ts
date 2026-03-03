/**
 * ZUGFeRD: XRechnung-XML in PDF einbetten (PDF mit Associated File)
 * Erzeugt ein PDF mit eingebettetem XML gemäß ZUGFeRD/Factur-X.
 * Hinweis: pdf-lib erzeugt keine PDF/A-3-konformen Dokumente. Das Ergebnis ist ein
 * Standard-PDF mit eingebettetem XML – viele ERP-Systeme und Behörden akzeptieren dies.
 * Für strenge PDF/A-3b-Konformität wäre z. B. node-zugferd oder ein externer Service nötig.
 */

import { PDFDocument, AFRelationship } from 'pdf-lib'

/** ZUGFeRD/Factur-X: Dateiname des eingebetteten XML (üblicher Konvention) */
export const ZUGFERD_XML_FILENAME = 'ZUGFeRD-invoice.xml'

/**
 * Bettet XRechnung-XML in ein PDF ein (ZUGFeRD-kompatibel).
 * @param pdfBytes – existierendes PDF (z. B. Rechnung)
 * @param xmlString – XRechnung UBL 2.1 XML
 * @returns PDF-Bytes mit eingebettetem XML
 */
export async function embedXrechnungInPdf(
  pdfBytes: Uint8Array,
  xmlString: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes)

  const xmlBytes = new TextEncoder().encode(xmlString)

  await doc.attach(xmlBytes, ZUGFERD_XML_FILENAME, {
    mimeType: 'application/xml',
    description: 'ZUGFeRD/XRechnung',
    afRelationship: AFRelationship.Alternative,
  })

  return doc.save()
}
