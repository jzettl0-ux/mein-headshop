import sharp from 'sharp'

export type WatermarkPosition = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center'

export interface WatermarkSettings {
  logo_url: string | null
  opacity: number
  position: WatermarkPosition
}

const GRAVITY_MAP: Record<WatermarkPosition, string> = {
  top_left: 'northwest',
  top_right: 'northeast',
  bottom_left: 'southwest',
  bottom_right: 'southeast',
  center: 'center',
}

const LOGO_MAX_WIDTH_RATIO = 0.25

/**
 * Wendet das Wasserzeichen auf einen Bild-Buffer an.
 * Gibt den neuen Buffer (PNG) zurück, oder den Original-Buffer wenn kein Logo / Fehler.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  settings: WatermarkSettings
): Promise<{ buffer: Buffer; width: number; height: number; format: string }> {
  if (!settings.logo_url?.trim() || settings.opacity <= 0) {
    const meta = await sharp(imageBuffer).metadata()
    const out = await sharp(imageBuffer).toBuffer()
    return {
      buffer: out,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      format: meta.format ?? 'jpeg',
    }
  }

  let logoBuffer: Buffer
  try {
    const res = await fetch(settings.logo_url)
    if (!res.ok) throw new Error('Logo konnte nicht geladen werden')
    const arr = await res.arrayBuffer()
    logoBuffer = Buffer.from(arr)
  } catch (e) {
    console.error('Watermark: logo fetch failed', e)
    const meta = await sharp(imageBuffer).metadata()
    const out = await sharp(imageBuffer).toBuffer()
    return { buffer: out, width: meta.width ?? 0, height: meta.height ?? 0, format: meta.format ?? 'jpeg' }
  }

  const image = sharp(imageBuffer)
  const imageMeta = await image.metadata()
  const width = imageMeta.width ?? 0
  const height = imageMeta.height ?? 0
  const logoWidth = Math.max(40, Math.floor(width * LOGO_MAX_WIDTH_RATIO))
  const opacity = Math.min(1, Math.max(0, settings.opacity / 100))

  let resizedLogo: Buffer
  try {
    resizedLogo = await sharp(logoBuffer)
      .resize(logoWidth, null, { withoutEnlargement: true })
      .ensureAlpha(opacity)
      .png()
      .toBuffer()
  } catch (e) {
    console.error('Watermark: logo resize failed', e)
    const out = await sharp(imageBuffer).toBuffer()
    return { buffer: out, width, height, format: imageMeta.format ?? 'jpeg' }
  }

  const gravity = GRAVITY_MAP[settings.position] as sharp.Gravity
  const outBuffer = await image
    .composite([{ input: resizedLogo, gravity }])
    .toBuffer()

  return {
    buffer: outBuffer,
    width,
    height,
    format: imageMeta.format ?? 'jpeg',
  }
}
