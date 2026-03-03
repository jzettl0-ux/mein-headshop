/**
 * Carrier-spezifische Adressformatierung für Retouren.
 * Absender = Kunde, Empfänger = Rücksendeadresse (Shop).
 * Jeder Versanddienstleister hat eigene Vorgaben – hier werden sie eingehalten.
 */

export interface CustomerAddress {
  name?: string
  first_name?: string
  last_name?: string
  street?: string
  house_number?: string
  postal_code?: string
  city?: string
  country?: string
}

export interface ReturnAddress {
  name: string
  street: string
  house_number: string
  postal_code: string
  city: string
  country?: string
}

/** Vollständiger Name aus first_name + last_name oder name */
function fullName(addr: CustomerAddress): string {
  if (addr.name?.trim()) return addr.name.trim()
  const first = (addr.first_name ?? '').trim()
  const last = (addr.last_name ?? '').trim()
  return `${first} ${last}`.trim() || 'Kunde'
}

/** Straße + Hausnummer kombiniert (manche Carrier trennen, andere nicht) */
function streetWithNumber(addr: CustomerAddress | ReturnAddress): string {
  const street = (addr.street ?? '').trim()
  const hn = 'house_number' in addr ? (addr.house_number ?? '').trim() : ''
  if (hn) return `${street} ${hn}`.trim()
  return street || '–'
}

/**
 * DHL: name1, addressStreet, addressHouse, postalCode, city getrennt.
 * DHL API erwartet genau diese Felder.
 */
export function formatForDhlShipper(addr: CustomerAddress): {
  name1: string
  name2?: string
  addressStreet: string
  addressHouse: string
  postalCode: string
  city: string
} {
  const street = (addr.street ?? '').trim()
  const parts = street.split(/\s+/)
  const houseNumber = (addr.house_number ?? '').trim() || (parts.length > 1 ? parts.pop()! : '0')
  const streetName = addr.house_number ? street : (parts.length > 1 ? parts.slice(0, -1).join(' ') : street) || 'Straße'
  return {
    name1: fullName(addr),
    addressStreet: streetName,
    addressHouse: houseNumber,
    postalCode: (addr.postal_code ?? '').trim() || '00000',
    city: (addr.city ?? '').trim() || 'Stadt',
  }
}

/**
 * Adresszeilen für Druck-Label (wie auf Paketaufkleber).
 * DHL/DPD/GLS: Absender oben links, Empfänger (Rücksendeadresse) rechts/darunter.
 */
export function formatAddressLinesForLabel(
  carrier: string,
  sender: CustomerAddress,
  recipient: ReturnAddress
): { senderLines: string[]; recipientLines: string[] } {
  const senderName = fullName(sender)
  const senderStreet = streetWithNumber(sender)
  const senderCity = `${(sender.postal_code ?? '').trim()} ${(sender.city ?? '').trim()}`.trim()

  const recipientStreet = streetWithNumber(recipient)
  const recipientCity = `${recipient.postal_code} ${recipient.city}`.trim()

  // DHL/DPD/GLS/Hermes/UPS: üblich Absender | Empfänger
  const senderLines = [senderName, senderStreet, senderCity].filter(Boolean)
  const recipientLines = [recipient.name, recipientStreet, recipientCity].filter(Boolean)

  return { senderLines, recipientLines }
}

/**
 * Platzhalter-Ersetzung für URL-Templates (return_prefill_url etc.).
 * Ersetzt {name}, {street}, {postal_code}, {city}, {return_name}, {return_street} usw.
 */
export function replaceReturnUrlPlaceholders(
  template: string,
  customer: CustomerAddress,
  returnAddr: ReturnAddress,
  orderNumber?: string,
  tracking?: string
): string {
  let s = template
  s = s.replace(/\{name\}/g, encodeURIComponent(fullName(customer)))
  s = s.replace(/\{street\}/g, encodeURIComponent((customer.street ?? '').trim()))
  s = s.replace(/\{house_number\}/g, encodeURIComponent((customer.house_number ?? '').trim()))
  s = s.replace(/\{postal_code\}/g, encodeURIComponent((customer.postal_code ?? '').trim()))
  s = s.replace(/\{city\}/g, encodeURIComponent((customer.city ?? '').trim()))
  s = s.replace(/\{country\}/g, encodeURIComponent((customer.country ?? 'DE').trim()))
  s = s.replace(/\{return_name\}/g, encodeURIComponent(returnAddr.name))
  s = s.replace(/\{return_street\}/g, encodeURIComponent(`${returnAddr.street} ${returnAddr.house_number}`.trim()))
  s = s.replace(/\{return_postal_code\}/g, encodeURIComponent(returnAddr.postal_code))
  s = s.replace(/\{return_city\}/g, encodeURIComponent(returnAddr.city))
  s = s.replace(/\{order_number\}/g, encodeURIComponent(orderNumber ?? ''))
  s = s.replace(/\{tracking\}/g, encodeURIComponent(tracking ?? ''))
  return s
}
