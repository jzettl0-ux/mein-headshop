import { Resend } from 'resend'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getResendFrom } from '@/lib/resend-from'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Premium Headshop'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const LOGIN_URL = `${BASE_URL.replace(/\/$/, '')}/login`

async function getLogoUrl(): Promise<string | undefined> {
  if (!hasSupabaseAdmin()) return undefined
  try {
    const admin = createSupabaseAdmin()
    const { data } = await admin.from('site_settings').select('value').eq('key', 'logo_url').maybeSingle()
    const url = data?.value?.trim()
    return url ? String(url) : undefined
  } catch {
    return undefined
  }
}

/** Shop-Farben – helles Design (theme-light), wie im Frontend */
const styles = {
  bg: '#FDFBF5',
  card: '#FFFFFF',
  border: '#e5e5e5',
  text: '#262626',
  muted: '#525252',
  gold: '#2D5A2D',
  goldLight: '#3D8B3D',
  primary: '#2D5A2D',
  headerBg: '#F5F5F5',
  gradient: 'linear-gradient(135deg, #2D5A2D 0%, #3D8B3D 100%)',
}

export function hasStaffInviteEmail(): boolean {
  return !!resend
}

/** Rollen-Labels und kurze Aufgabenbeschreibung für die Willkommens-E-Mail – angepasst an Headshop */
const ROLE_TASKS: Record<string, { label: string; tasks: string[] }> = {
  owner: {
    label: 'Inhaber',
    tasks: ['Voller Zugriff auf den gesamten Shop und alle Bereiche', 'Mitarbeiter einladen, Rollen zuweisen und verwalten', 'Finanzen, Einstellungen und Einkauf'],
  },
  chef: {
    label: 'Chef / Geschäftsführung',
    tasks: ['Voller Zugriff wie Inhaber (außer Finanz-Parameter)', 'Mitarbeiter einladen und verwalten', 'Lager, Wareneingang, Bestellungen und Kundenservice'],
  },
  admin: {
    label: 'Shop-Administrator',
    tasks: ['Bestellungen bearbeiten, Versand und Stornos/Rücksendungen', 'Produkte, Influencer und Startseite pflegen', 'Rabattcodes, Bewertungs-Moderation und Einkauf'],
  },
  product_care: {
    label: 'Produktpflege',
    tasks: ['Produkte anlegen und bearbeiten (Sortiment)', 'Influencer und Startseiten-Kategorien verwalten', 'Bewertungen prüfen und freigeben'],
  },
  support: {
    label: 'Kundenservice',
    tasks: ['Kundenanfragen beantworten und Kundenservice führen', 'Bestellungen einsehen und Versandstatus pflegen', 'Bewertungen und Feedback einsehen – keine Produkt-/Preisbearbeitung'],
  },
  employee: {
    label: 'Lager / Versand',
    tasks: ['Bestellungen bearbeiten, packen und versandbereit machen', 'Kundenanfragen bearbeiten und Kundenservice unterstützen', 'Bewertungen einsehen – kein Zugriff auf Einkauf oder Einstellungen'],
  },
}

export interface StaffWelcomeEmailOptions {
  /** Zugewiesene Rollen – für die Aufgaben-Kurzanleitung */
  roles?: string[]
  /** true = Wiedereinsteiger („Schön, dich wiederzusehen“), false/undefined = Neuzugang */
  isReinvite?: boolean
}

/**
 * Sendet die Willkommens-E-Mail an (neue oder wieder eingestiegene) Mitarbeiter.
 * Enthält freundliche Begrüßung (neu vs. Willkommen zurück), Kurzanleitung Passwort/Login und Aufgaben je Rolle.
 */
export async function sendStaffInviteWelcomeEmail(
  to: string,
  options: StaffWelcomeEmailOptions = {}
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    return { ok: false, error: 'RESEND_API_KEY nicht konfiguriert' }
  }

  const { roles = [], isReinvite = false } = options
  const logoUrl = await getLogoUrl()

  const headline = isReinvite ? 'Schön, dich wiederzusehen!' : 'Willkommen im Team!'
  const subline = isReinvite
    ? 'Du gehörst wieder dazu – wir haben dich erneut als Mitarbeiter:in angelegt und freuen uns, dass du wieder an Bord bist.'
    : 'Du bist ab sofort Teil unseres Teams und unterstützt uns dabei, unseren Shop und unsere Kund:innen bestmöglich zu betreuen.'

  const introParagraph = isReinvite
    ? `Hallo, wir freuen uns sehr, dich wieder bei <strong style="color:${styles.goldLight};">${SITE_NAME}</strong> begrüßen zu dürfen! ${subline}`
    : `Hallo, wir freuen uns sehr, dich als Mitarbeiterin bzw. Mitarbeiter bei <strong style="color:${styles.goldLight};">${SITE_NAME}</strong> begrüßen zu dürfen! ${subline}`

  const roleBlocks = roles.length > 0
    ? roles
        .filter((r) => ROLE_TASKS[r])
        .map((roleKey) => {
          const { label, tasks } = ROLE_TASKS[roleKey]
          const taskList = tasks.map((t) => `<li style="margin:4px 0 0 16px;">${t}</li>`).join('')
          return `
            <div style="margin-bottom:16px;">
              <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:${styles.goldLight};">${label}</p>
              <ul style="margin:0;padding:0;list-style:disc;font-size:14px;line-height:1.5;color:${styles.text};">${taskList}</ul>
            </div>`
        })
        .join('')
    : `
            <p style="margin:0;font-size:14px;line-height:1.5;color:${styles.text};">
              Im Admin-Bereich siehst du je nach deinen Rollen Bestellungen, Produkte, Kundenservice und weitere Bereiche. Dein Team erklärt dir gerne die ersten Schritte.
            </p>`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${headline} – ${SITE_NAME}</title>
</head>
<body style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:${styles.bg};color:${styles.text};padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="background:${styles.card};border:1px solid ${styles.border};border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <div style="background:${styles.headerBg};padding:28px 24px;text-align:center;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${SITE_NAME}" width="140" height="42" style="display:inline-block;max-height:42px;width:auto;object-fit:contain;" />` : `<span style="font-size:22px;font-weight:700;color:#262626;letter-spacing:0.02em;">${SITE_NAME}</span>`}
      </div>
      <div style="padding:32px 24px;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${styles.text};">
          ${headline}
        </h1>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:${styles.muted};">
          Hallo,
        </p>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:${styles.text};">
          ${introParagraph}
        </p>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:${styles.text};">
          Damit du dich einloggen kannst, haben wir dir <strong>in einer separaten E-Mail</strong> einen Link zum Festlegen deines Passworts geschickt (sie kann kurz vor oder nach dieser E-Mail ankommen). So geht’s weiter:
        </p>

        <div style="background:#f8faf8;border:1px solid ${styles.border};border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:${styles.gold};text-transform:uppercase;letter-spacing:0.04em;">Kurzanleitung</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:32px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:${styles.gradient};color:#ffffff;font-size:12px;font-weight:700;border-radius:50%;">1</span></td>
              <td style="padding:8px 0 8px 12px;font-size:15px;line-height:1.5;color:${styles.text};"><strong>Link öffnen:</strong> In der anderen E-Mail findest du einen Link „Passwort festlegen“. Klicke darauf.</td>
            </tr>
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:32px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:${styles.gradient};color:#ffffff;font-size:12px;font-weight:700;border-radius:50%;">2</span></td>
              <td style="padding:8px 0 8px 12px;font-size:15px;line-height:1.5;color:${styles.text};"><strong>Passwort wählen:</strong> Lege ein sicheres Passwort fest (mind. 8 Zeichen). Danach bist du eingeloggt.</td>
            </tr>
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:32px;"><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:${styles.gradient};color:#ffffff;font-size:12px;font-weight:700;border-radius:50%;">3</span></td>
              <td style="padding:8px 0 8px 12px;font-size:15px;line-height:1.5;color:${styles.text};"><strong>Später einloggen:</strong> Unter <a href="${LOGIN_URL}" style="color:${styles.gold};text-decoration:underline;">${LOGIN_URL}</a> meldest du dich mit E-Mail und Passwort an.</td>
            </tr>
          </table>
        </div>

        <div style="background:#f8faf8;border:1px solid ${styles.border};border-radius:12px;padding:20px;margin-bottom:28px;">
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${styles.gold};text-transform:uppercase;letter-spacing:0.04em;">Deine Aufgaben (Kurzanleitung)</p>
          ${roleBlocks}
        </div>

        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:${styles.text};">
          Falls du den Link nicht findest, schau bitte in deinem Spam-Ordner nach. Bei Fragen melde dich einfach bei uns – wir helfen dir gerne weiter.
        </p>
        <p style="margin:0;font-size:16px;line-height:1.7;color:${styles.text};">
          ${isReinvite ? 'Wir freuen uns, dass du wieder dabei bist!' : 'Nochmals herzlich willkommen – wir freuen uns auf die Zusammenarbeit mit dir!'}
        </p>
        <p style="margin:24px 0 0;font-size:15px;color:${styles.goldLight};font-weight:600;">
          Dein Team von ${SITE_NAME}
        </p>
      </div>
    </div>
    <p style="margin:24px 0 0;text-align:center;font-size:13px;color:${styles.muted};">
      Diese E-Mail wurde an dich gesendet, weil du als Mitarbeiter:in zu ${SITE_NAME} eingeladen wurdest.
    </p>
  </div>
</body>
</html>
`.trim()

  const subject = isReinvite
    ? `Schön, dich wiederzusehen – ${SITE_NAME}`
    : `Willkommen im Team – ${SITE_NAME} 🎉`

  try {
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to,
      subject,
      html,
    })
    if (error) {
      console.error('[StaffInvite] Resend error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[StaffInvite] Send error:', msg)
    return { ok: false, error: msg }
  }
}
