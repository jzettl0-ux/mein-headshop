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
  render,
} from '@react-email/components'
import * as React from 'react'

const background = '#0A0A0A'
const gold = '#D4AF37'
const silver = '#8A8A8A'
const cardBg = '#1A1A1A'
const border = '#2A2A2A'

export interface OrderConfirmationProps {
  orderNumber: string
  customerName: string
  items: Array<{ name: string; quantity: number; price: number }>
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
}: OrderConfirmationProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://premium-headshop.de'
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: background, color: '#FFFFFF', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
          {/* Header */}
          <Section
            style={{
              background: `linear-gradient(135deg, ${gold} 0%, #b8860b 50%, #39FF14 100%)`,
              borderRadius: 12,
              padding: 32,
              textAlign: 'center' as const,
              marginBottom: 24,
            }}
          >
            <Heading style={{ color: background, margin: 0, fontSize: 26, fontWeight: 'bold' }}>
              Bestellung bestätigt
            </Heading>
            <Text style={{ color: background, margin: '8px 0 0', fontSize: 14, opacity: 0.9 }}>
              Premium Headshop
            </Text>
          </Section>

          <Text style={{ color: '#FFFFFF', fontSize: 16, lineHeight: 1.6 }}>
            Hallo {customerName},
          </Text>
          <Text style={{ color: silver, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
            vielen Dank für deine Bestellung. Wir haben deine Zahlung erhalten und bearbeiten deine Bestellung.
          </Text>

          {/* Bestellnummer */}
          <Section
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${gold}`,
              borderRadius: 8,
              padding: 20,
              textAlign: 'center' as const,
              margin: '24px 0',
            }}
          >
            <Text style={{ color: silver, fontSize: 12, margin: 0, textTransform: 'uppercase' }}>
              Bestellnummer
            </Text>
            <Text style={{ color: gold, fontSize: 24, fontWeight: 'bold', margin: '4px 0 0' }}>
              #{orderNumber}
            </Text>
          </Section>

          {hasAdultItems && (
            <Section
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <Text style={{ color: '#EF4444', fontWeight: 'bold', margin: 0 }}>
                Altersverifikation erforderlich (18+)
              </Text>
              <Text style={{ color: '#EF4444', fontSize: 14, margin: '8px 0 0' }}>
                Bei der Zustellung ist eine Identitätsprüfung durch DHL erforderlich. Bitte halte deinen Ausweis bereit.
              </Text>
            </Section>
          )}

          {/* Produktliste */}
          <Heading as="h2" style={{ color: '#FFFFFF', fontSize: 18, marginBottom: 12 }}>
            Bestellte Artikel
          </Heading>
          <Section
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {items.map((item, i) => (
              <Row key={i} style={{ borderBottom: i < items.length - 1 ? `1px solid ${border}` : 'none', padding: '12px 16px' }}>
                <Column style={{ width: '60%' }}>
                  <Text style={{ color: '#FFFFFF', margin: 0, fontSize: 14 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: silver, margin: '2px 0 0', fontSize: 12 }}>
                    {item.quantity} × {(item.price).toFixed(2)} €
                  </Text>
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  <Text style={{ color: gold, margin: 0, fontSize: 14, fontWeight: 'bold' }}>
                    {(item.price * item.quantity).toFixed(2)} €
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Summen */}
          <Section style={{ marginTop: 24 }}>
            <Row style={{ padding: '8px 0' }}>
              <Column><Text style={{ color: silver, margin: 0, fontSize: 14 }}>Zwischensumme</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ color: '#FFFFFF', margin: 0, fontSize: 14 }}>{subtotal.toFixed(2)} €</Text></Column>
            </Row>
            <Row style={{ padding: '8px 0' }}>
              <Column><Text style={{ color: silver, margin: 0, fontSize: 14 }}>Versand</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ color: '#FFFFFF', margin: 0, fontSize: 14 }}>{shipping.toFixed(2)} €</Text></Column>
            </Row>
            <Hr style={{ borderColor: border, margin: '12px 0' }} />
            <Row style={{ padding: '8px 0' }}>
              <Column><Text style={{ color: '#FFFFFF', margin: 0, fontSize: 16, fontWeight: 'bold' }}>Gesamt</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ color: gold, margin: 0, fontSize: 18, fontWeight: 'bold' }}>{total.toFixed(2)} €</Text></Column>
            </Row>
          </Section>

          {/* Lieferadresse */}
          <Heading as="h2" style={{ color: '#FFFFFF', fontSize: 18, marginTop: 28, marginBottom: 12 }}>
            Lieferadresse
          </Heading>
          <Section
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <Text style={{ color: silver, margin: 0, fontSize: 14, lineHeight: 1.6 }}>
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
                  backgroundColor: gold,
                  color: background,
                  padding: '12px 28px',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                Bestellung im Kundenbereich anzeigen
              </Link>
              <Text style={{ color: silver, fontSize: 12, marginTop: 12 }}>
                Deine Rechnung kannst du dort als PDF herunterladen.
              </Text>
            </Section>
          )}

          <Hr style={{ borderColor: border, margin: '32px 0 16px' }} />
          <Text style={{ color: silver, fontSize: 12, textAlign: 'center' as const }}>
            Bei Fragen: {siteUrl}/impressum · © {new Date().getFullYear()} Premium Headshop
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderOrderConfirmationEmail(props: OrderConfirmationProps): Promise<string> {
  return render(React.createElement(OrderConfirmationEmail, props))
}
