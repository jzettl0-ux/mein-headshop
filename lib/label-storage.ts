/**
 * Versandlabel-PDFs in Supabase Storage speichern (z. B. GLS liefert Base64, kein URL).
 * Bucket: "labels" – in Supabase Dashboard unter Storage anlegen und ggf. öffentlich machen,
 * damit Label-URLs dauerhaft funktionieren. Ohne Bucket wird nur labelPdfBase64 an das Frontend zurückgegeben.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'labels'

/**
 * PDF als Base64 in Storage hochladen, öffentliche URL zurückgeben.
 * Pfad: {orderId}/{trackingNumber}.pdf
 */
export async function uploadLabelPdf(
  admin: SupabaseClient,
  orderId: string,
  trackingNumber: string,
  base64Pdf: string
): Promise<string> {
  const buffer = Buffer.from(base64Pdf, 'base64')
  const path = `${orderId}/${encodeURIComponent(trackingNumber)}.pdf`
  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (error) throw new Error(`Label-Upload fehlgeschlagen: ${error.message}`)
  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
