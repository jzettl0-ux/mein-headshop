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
  render,
} from '@react-email/components'
import * as React from 'react'
import { emailStyles as s } from './email-styles'
import { ShopEmailHeader } from './ShopEmailHeader'
import { ShopEmailFooter } from './ShopEmailFooter'

export interface OrderReceivedProps {
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
  /** Öffentliche URL des Shop-Logos (z. B. aus site_settings) */
  logoUrl?: string
}

/**
 * E-Mail unmittelbar nach Abschluss der Bestellung (vor Zahlung).
 * Hinweis: Zahlung wird geprüft, weitere Infos per E-Mail.
 */
export function OrderReceivedEmail({
  orderNumber,
  customerName,
  items,
  subtotal,
  shipping,
  total,
  shippingAddress,
  hasAdultItems,
  logoUrl,
}: OrderReceivedProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: s.background, color: s.text, fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 520, margin: '0 auto', padding: 32 }}>
          <Section style={{ backgroundColor: s.cardBg, border: `1px solid ${s.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <ShopEmailHeader logoUrl={logoUrl} />
            <Section style={{ padding: '32px 24px' }}>
              <Heading style={{ color: s.text, margin: '0 0 8px', fontSize: 22, fontWeight: 'bold' }}>
                Bestellung eingegangen
              </Heading>
              <Text style={{ color: s.text, fontSize: 16, lineHeight: 1.6 }}>
            Hallo {customerName},
          </Text>
          <Text style={{ color: s.textMuted, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
            vielen Dank für deine Bestellung. Du wirst jetzt zur Zahlung weitergeleitet.
          </Text>
          <Text style={{ color: s.textMuted, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
            <strong style={{ color: s.text }}>Nach Prüfung des Zahlungseingangs</strong> bearbeiten wir deine Bestellung und du erhältst <strong style={{ color: s.text }}>weitere Informationen per E-Mail</strong>: zuerst die Zahlungsbestätigung und danach die Versandbenachrichtigung mit Sendungsverfolgung.
          </Text>

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
                Bei der Zustellung ist eine Identitätsprüfung durch DHL erforderlich.
              </Text>
            </Section>
          )}

          <Heading as="h2" style={{ color: s.text, fontSize: 18, marginBottom: 12 }}>
            Bestellte Artikel
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
              <Row key={i} style={{ borderBottom: i < items.length - 1 ? `1px solid ${s.border}` : 'none', padding: '12px 16px' }}>
                <Column style={{ width: '60%' }}>
                  <Text style={{ color: s.text, margin: 0, fontSize: 14 }}>{item.name}</Text>
                  <Text style={{ color: s.textMuted, margin: '2px 0 0', fontSize: 12 }}>
                    {item.quantity} × {(item.price).toFixed(2)} €
                  </Text>
                </Column>
                <Column style={{ width: '40%', textAlign: 'right' }}>
                  <Text style={{ color: s.primary, margin: 0, fontSize: 14, fontWeight: 'bold' }}>
                    {(item.price * item.quantity).toFixed(2)} €
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

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

              <ShopEmailFooter />
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderOrderReceivedEmail(props: OrderReceivedProps): Promise<string> {
  return render(React.createElement(OrderReceivedEmail, props))
}
