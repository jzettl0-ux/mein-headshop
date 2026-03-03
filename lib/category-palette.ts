/**
 * Vordefinierte Farbpalette für Startseiten-Kategorien.
 * Hex-Werte werden für die Kacheln (sichtbare Farben) und Vorschau genutzt.
 */

export interface CategoryPalettePreset {
  id: string
  name: string
  gradient: string
  icon_color: string
  gradient_start_hex: string
  gradient_end_hex: string
  icon_color_hex: string
}

export const CATEGORY_PALETTE: CategoryPalettePreset[] = [
  { id: 'gold', name: 'Gold', gradient: 'from-amber-400/25 to-yellow-600/25', icon_color: 'text-amber-400', gradient_start_hex: '#FBBF24', gradient_end_hex: '#CA8A04', icon_color_hex: '#FBBF24' },
  { id: 'luxe-gold', name: 'Luxe Gold', gradient: 'from-luxe-gold/25 to-amber-700/20', icon_color: 'text-luxe-gold', gradient_start_hex: '#D4AF37', gradient_end_hex: '#B45309', icon_color_hex: '#D4AF37' },
  { id: 'neon', name: 'Neon', gradient: 'from-luxe-neon/30 to-emerald-500/25', icon_color: 'text-luxe-neon', gradient_start_hex: '#39FF14', gradient_end_hex: '#10B981', icon_color_hex: '#39FF14' },
  { id: 'purple-pink', name: 'Lila–Pink', gradient: 'from-purple-500/25 to-pink-500/25', icon_color: 'text-purple-400', gradient_start_hex: '#A855F7', gradient_end_hex: '#EC4899', icon_color_hex: '#C084FC' },
  { id: 'violet-fuchsia', name: 'Violett–Fuchsia', gradient: 'from-violet-500/25 to-fuchsia-500/25', icon_color: 'text-violet-400', gradient_start_hex: '#8B5CF6', gradient_end_hex: '#D946EF', icon_color_hex: '#A78BFA' },
  { id: 'blue-cyan', name: 'Blau–Cyan', gradient: 'from-blue-500/25 to-cyan-500/25', icon_color: 'text-blue-400', gradient_start_hex: '#3B82F6', gradient_end_hex: '#06B6D4', icon_color_hex: '#60A5FA' },
  { id: 'indigo-sky', name: 'Indigo–Hellblau', gradient: 'from-indigo-500/25 to-sky-400/25', icon_color: 'text-indigo-400', gradient_start_hex: '#6366F1', gradient_end_hex: '#38BDF8', icon_color_hex: '#818CF8' },
  { id: 'emerald-teal', name: 'Smaragd–Türkis', gradient: 'from-emerald-500/25 to-teal-500/25', icon_color: 'text-emerald-400', gradient_start_hex: '#10B981', gradient_end_hex: '#14B8A6', icon_color_hex: '#34D399' },
  { id: 'rose-red', name: 'Rose–Rot', gradient: 'from-rose-500/25 to-red-500/25', icon_color: 'text-rose-400', gradient_start_hex: '#F43F5E', gradient_end_hex: '#EF4444', icon_color_hex: '#FB7185' },
  { id: 'orange-amber', name: 'Orange–Bernstein', gradient: 'from-orange-500/25 to-amber-500/25', icon_color: 'text-orange-400', gradient_start_hex: '#F97316', gradient_end_hex: '#F59E0B', icon_color_hex: '#FB923C' },
  { id: 'slate-zinc', name: 'Slate–Zinc', gradient: 'from-slate-500/20 to-zinc-600/20', icon_color: 'text-slate-300', gradient_start_hex: '#64748B', gradient_end_hex: '#52525B', icon_color_hex: '#CBD5E1' },
  { id: 'soft-mix', name: 'Weiches Mix', gradient: 'from-purple-400/20 via-pink-400/15 to-amber-400/20', icon_color: 'text-pink-300', gradient_start_hex: '#C084FC', gradient_end_hex: '#FBBF24', icon_color_hex: '#F9A8D4' },
]
