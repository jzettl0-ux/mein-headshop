import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Row,
  Column,
  Heading,
  Hr,
  Link,
  Img,
  render,
} from '@react-email/components'
import * as React from 'react'
import { emailStyles as s } from './email-styles'
import { ShopEmailHeader } from './ShopEmailHeader'
import { ShopEmailFooter } from './ShopEmailFooter'

export interface OrderConfirmationProps {
  orderNumber: string
  customerName: string
  items: Array<{ name: string; quantity: number; price: number; product_slug?: string; product_image?: string }>
  subtotal: number
  shipping: number
  total: number
  shippingAddress: {
    street: string
    house_number: string
    postal_code: string
    city: string
  }
  hasAdultItems?: boolean
  accountOrdersUrl?: string
  attachInvoice?: boolean
  /** Öffentliche URL des Shop-Logos (z. B. aus site_settings) */
  logoUrl?: string
}

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  subtotal,
  shipping,
  total,
  shippingAddress,
  hasAdultItems,
  accountOrdersUrl,
  attachInvoice,
  logoUrl,
}: OrderConfirmationProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://premium-headshop.de'
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: s.background, color: s.text, fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 520, margin: '0 auto', padding: 32 }}>
          <Section style={{ backgroundColor: s.cardBg, border: `1px solid ${s.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <ShopEmailHeader logoUrl={logoUrl} />
            <Section style={{ padding: '32px 24px' }}>
              <Heading style={{ color: s.text, margin: '0 0 8px', fontSize: 22, fontWeight: 'bold' }}>
                Bestellung bestätigt
              </Heading>
              <Text style={{ color: s.text, fontSize: 16, lineHeight: 1.6 }}>
            Hallo {customerName},
          </Text>
          <Text style={{ color: s.textMuted, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
            vielen Dank für deine Bestellung. Wir haben deine Zahlung erhalten und bearbeiten deine Bestellung.
          </Text>
          <Text style={{ color: s.text, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
            Hier ist deine Bestellung <strong>#{orderNumber}</strong> im Überblick – so behältst du immer den Überblick, was du bestellt hast:
          </Text>
          {attachInvoice && (
            <Text style={{ color: s.textMuted, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
              <strong style={{ color: s.text }}>Im Anhang</strong> findest du deine Rechnung als PDF mit allen Bestelldetails (Artikel, Preise, Summen, Adresse).
            </Text>
          )}

          {/* Bestellnummer */}
          <Section
            style={{
              backgroundColor: s.cardBg,
              border: `1px solid ${s.primary}`,
              borderRadius: 8,
              padding: 20,
              textAlign: 'center' as const,
              margin: '24px 0',
            }}
          >
            <Text style={{ color: s.textMuted, fontSize: 12, margin: 0, textTransform: 'uppercase' }}>
              Bestellnummer
            </Text>
            <Text style={{ color: s.primary, fontSize: 24, fontWeight: 'bold', margin: '4px 0 0' }}>
              #{orderNumber}
            </Text>
          </Section>

          {hasAdultItems && (
            <Section
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <Text style={{ color: '#DC2626', fontWeight: 'bold', margin: 0 }}>
                Altersverifikation erforderlich (18+)
              </Text>
              <Text style={{ color: '#B91C1C', fontSize: 14, margin: '8px 0 0' }}>
                Bei der Zustellung ist eine Identitätsprüfung durch DHL erforderlich. Bitte halte deinen Ausweis bereit.
              </Text>
            </Section>
          )}

          {/* Produktliste mit Bildern */}
          <Heading as="h2" style={{ color: s.text, fontSize: 18, marginBottom: 12 }}>
            Deine bestellten Artikel
          </Heading>
          <Section
            style={{
              backgroundColor: s.cardBg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {items.map((item, i) => (
              <Row key={i} style={{ borderBottom: i < items.length - 1 ? `1px solid ${s.border}` : 'none', padding: '12px 16px', alignItems: 'center' }}>
                <Column style={{ width: 72, verticalAlign: 'middle', paddingRight: 12 }}>
                  {item.product_image ? (
                    <Img
                      src={item.product_image}
                      alt={item.name}
                      width={56}
                      height={56}
                      style={{ borderRadius: 8, objectFit: 'cover', display: 'block' }}
                    />
                  ) : null}
                </Column>
                <Column style={{ width: '50%', verticalAlign: 'middle' }}>
                  <Text style={{ color: s.text, margin: 0, fontSize: 14, fontWeight: 600 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: s.textMuted, margin: '2px 0 0', fontSize: 12 }}>
                    {item.quantity} × {(item.price).toFixed(2)} €
                  </Text>
                </Column>
                <Column style={{ width: 90, textAlign: 'right', verticalAlign: 'middle' }}>
                  <Text style={{ color: s.primary, margin: 0, fontSize: 14, fontWeight: 'bold' }}>
                    {(item.price * item.quantity).toFixed(2)} €
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Summen */}
          <Section style={{ marginTop: 24 }}>
            <Row style={{ padding: '8px 0' }}>
              <Column><Text style={{ color: s.textMuted, margin: 0, fontSize: 14 }}>Zwischensumme</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ color: s.text, margin: 0, fontSize: 14 }}>{subtotal.toFixed(2)} €</Text></Column>
            </Row>
            <Row style={{ padding: '8px 0' }}>
              <Column><Text style={{ color: s.textMuted, margin: 0, fontSize: 14 }}>Versand</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ color: s.text, margin: 0, fontSize: 14 }}>{shipping.toFixed(2)} €</Text></Column>
            </Row>
            <Hr style={{ borderColor: s.border, margin: '12px 0' }} />
            <Row style={{ padding: '8px 0' }}>
              <Column><Text style={{ color: s.text, margin: 0, fontSize: 16, fontWeight: 'bold' }}>Gesamt</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ color: s.primary, margin: 0, fontSize: 18, fontWeight: 'bold' }}>{total.toFixed(2)} €</Text></Column>
            </Row>
          </Section>

          {/* Lieferadresse */}
          <Heading as="h2" style={{ color: s.text, fontSize: 18, marginTop: 28, marginBottom: 12 }}>
            Lieferadresse
          </Heading>
          <Section
            style={{
              backgroundColor: s.cardBg,
              border: `1px solid ${s.border}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <Text style={{ color: s.textMuted, margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              {customerName}<br />
              {shippingAddress.street} {shippingAddress.house_number}<br />
              {shippingAddress.postal_code} {shippingAddress.city}
            </Text>
          </Section>

          {accountOrdersUrl && (
            <Section style={{ textAlign: 'center' as const, marginTop: 28 }}>
              <Link
                href={accountOrdersUrl}
                style={{
                  display: 'inline-block',
                  backgroundColor: s.primary,
                  color: s.background,
                  padding: '12px 28px',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                Bestellung im Kundenbereich anzeigen
              </Link>
              <Text style={{ color: s.textMuted, fontSize: 12, marginTop: 12 }}>
                Deine Rechnung kannst du dort als PDF herunterladen.
              </Text>
            </Section>
          )}

          {/* Bitte bewerten + direkte Links zu den bestellten Produkten */}
          {items.some((i) => i.product_slug) && (
            <Section
              style={{
                backgroundColor: s.cardBg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
                padding: 20,
                marginTop: 24,
              }}
            >
              <Heading as="h2" style={{ color: s.text, fontSize: 16, margin: '0 0 8px' }}>
                Deine Meinung zählt
              </Heading>
              <Text style={{ color: s.textMuted, fontSize: 14, lineHeight: 1.5, margin: '0 0 12px' }}>
                Hast du deine bestellten Produkte schon ausprobiert? Wir freuen uns über eine kurze Bewertung – sie hilft anderen Kunden bei der Entscheidung.
              </Text>
              <Text style={{ color: s.text, fontSize: 14, margin: '0 0 8px' }}>Schnell zu deinen Produkten:</Text>
              {items.filter((i) => i.product_slug).map((item, idx) => (
                <div key={idx} style={{ marginBottom: 6 }}>
                  <Link
                    href={`${siteUrl}/shop/${item.product_slug}`}
                    style={{ color: s.primary, fontSize: 14, textDecoration: 'underline' }}
                  >
                    {item.name}
                  </Link>
                </div>
              ))}
              <Text style={{ color: s.textMuted, fontSize: 12, marginTop: 12 }}>
                Auf der Produktseite kannst du direkt bewerten (eine Bewertung pro Bestellung möglich).
              </Text>
            </Section>
          )}

              <ShopEmailFooter />
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderOrderConfirmationEmail(props: OrderConfirmationProps): Promise<string> {
  return render(React.createElement(OrderConfirmationEmail, props))
}
