import type { WatermarkSettings } from './watermark'

const DEFAULTS: WatermarkSettings = {
  logo_url: null,
  opacity: 50,
  position: 'bottom_right',
}

/**
 * Lädt die Wasserzeichen-Einstellungen aus der DB (erste Zeile).
 * Für Server/Admin mit createSupabaseAdmin.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getWatermarkSettings(admin: any): Promise<WatermarkSettings> {
  const { data } = await admin.from('watermark_settings').select('logo_url, opacity, position').limit(1)
  const rows = data as Array<{ logo_url: string | null; opacity: number; position: string }> | null
  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
  if (!row) return DEFAULTS
  const position = ['top_left', 'top_right', 'bottom_left', 'bottom_right', 'center'].includes(row.position)
    ? (row.position as WatermarkSettings['position'])
    : DEFAULTS.position
  return {
    logo_url: row.logo_url?.trim() || null,
    opacity: Math.min(100, Math.max(0, Number(row.opacity) ?? DEFAULTS.opacity)),
    position,
  }
}
