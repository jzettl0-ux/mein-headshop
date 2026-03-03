import type { StaffRole } from '@/lib/admin-auth'

/**
 * Rollen-Hierarchie für den Headshop:
 * - owner: Inhaber – einziger voller Admin (Einstellungen, Finanzen, Mitarbeiter, Verträge)
 * - chef: Chef/Geschäftsführung – alles außer Einstellungen, Finanzen, Mitarbeiter
 * - hr: Personal / Einstellung – Mitarbeiter einladen, anlegen, verwalten; darf keine Rollen owner/chef vergeben
 * - admin: Shop-Administrator – Bestellungen, Produkte, Einkauf, Rabattcodes
 * - product_care: Produktpflege – Sortiment, Influencer, Bewertungen
 * - support: Kundenservice – Kundenanfragen, Bestellungen einsehen
 * - employee: Lager/Versand – Bestellungen bearbeiten, Kundenservice
 * - team_leader: Teamleiter für einen Bereich; Bestellungen + Kundenservice
 * - warehouse_lead: Lagerleitung; Lager + Bestellungen
 * - marketing: Nur Marketing (Rabattcodes, Newsletter, Werbung)
 */
const ORDER_ROLES: StaffRole[] = ['owner', 'chef', 'admin', 'support', 'employee', 'team_leader', 'warehouse_lead']
const PRODUCT_ROLES: StaffRole[] = ['owner', 'chef', 'admin', 'product_care']
/** Nur Owner: Finanzen und Einstellungen (app/admin/finances/** und app/admin/settings/**) */
const OWNER_ONLY_ROLES: StaffRole[] = ['owner']
/** Lager & Bestellseiten: Owner, Chef, Lagerleitung */
const INVENTORY_AND_ORDERS_MANAGER_ROLES: StaffRole[] = ['owner', 'chef', 'warehouse_lead']
/** Marketing (Rabattcodes, Newsletter, Werbung) */
const MARKETING_ROLES: StaffRole[] = ['owner', 'chef', 'admin', 'marketing']
/** Einkaufspreise / Margen in Produktliste und -bearbeitung: nur Owner, Chef, Admin */
const SEE_PURCHASE_PRICES_ROLES: StaffRole[] = ['owner', 'chef', 'admin']

/**
 * Darf (mind. eine) dieser Rollen Bestellungen & Kundenservice sehen/bearbeiten?
 */
export function canAccessOrders(roles: StaffRole[]): boolean {
  return roles.some((r) => ORDER_ROLES.includes(r))
}

/**
 * Darf (mind. eine) dieser Rollen Produkte, Influencer, Startseite bearbeiten?
 */
export function canAccessProducts(roles: StaffRole[]): boolean {
  return roles.some((r) => PRODUCT_ROLES.includes(r))
}

/**
 * Darf (mind. eine) dieser Rollen Einstellungen, Rabattcodes, Kostenrechner sehen?
 * Achtung: Finanzen und settings/** sind nur für Owner (canAccessFinances / canAccessSettingsOwnerOnly).
 */
export function canAccessSettings(roles: StaffRole[]): boolean {
  return roles.some((r) => OWNER_ONLY_ROLES.includes(r))
}

/**
 * Finanz-Seiten (app/admin/finances/**) – NUR Owner.
 */
export function canAccessFinances(roles: StaffRole[]): boolean {
  return roles.some((r) => OWNER_ONLY_ROLES.includes(r))
}

/**
 * Einstellungen (app/admin/settings/**) – NUR Owner.
 */
export function canAccessSettingsOwnerOnly(roles: StaffRole[]): boolean {
  return roles.some((r) => OWNER_ONLY_ROLES.includes(r))
}

/**
 * Lager-Seiten (app/admin/inventory/**) – Owner, Chef, Lagerleitung.
 */
export function canAccessInventory(roles: StaffRole[]): boolean {
  return roles.some((r) => INVENTORY_AND_ORDERS_MANAGER_ROLES.includes(r))
}

/**
 * Marketing-Seiten (Rabattcodes, Newsletter, Werbung) – Owner, Chef, Admin, Marketing.
 */
export function canAccessMarketing(roles: StaffRole[]): boolean {
  return roles.some((r) => MARKETING_ROLES.includes(r))
}

/** Owner, Chef und Personal (hr) dürfen Mitarbeiter einstellen und verwalten. Chef/hr dürfen Inhaber-Konto nicht ändern; hr darf keine Rollen owner/chef vergeben. */
const STAFF_MANAGER_ROLES: StaffRole[] = ['owner', 'chef', 'hr']
export function canManageStaff(roles: StaffRole[]): boolean {
  return roles.some((r) => STAFF_MANAGER_ROLES.includes(r))
}

/**
 * Einkaufspreise und Margen in Produktliste / -bearbeitung anzeigen – nur Owner, Chef, Admin.
 * Staff (support, employee, product_care) sieht nur Bestand und Namen.
 */
export function canSeePurchasePrices(roles: StaffRole[]): boolean {
  return roles.some((r) => SEE_PURCHASE_PRICES_ROLES.includes(r))
}

/** Feedback/Bewertungen: Order-Rollen + Produktpflege */
const FEEDBACK_ROLES: StaffRole[] = ['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'team_leader', 'warehouse_lead']
export function canAccessFeedback(roles: StaffRole[]): boolean {
  return roles.some((r) => FEEDBACK_ROLES.includes(r))
}
