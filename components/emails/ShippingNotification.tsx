import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
  Button,
  Row,
  Column,
} from '@react-email/components'
import * as React from 'react'
import { render } from '@react-email/components'
import { emailStyles as s } from './email-styles'
import { ShopEmailHeader } from './ShopEmailHeader'
import { ShopEmailFooter } from './ShopEmailFooter'

export interface ShippingNotificationShipment {
  trackingNumber: string
  trackingCarrier?: string
  trackingUrl: string
}

export interface ShippingNotificationItem {
  name: string
  quantity: number
  price: number
  product_image?: string
}

export interface ShippingNotificationProps {
  orderNumber: string
  customerName: string
  /** Eine oder mehrere Sendungen – alle in einer E-Mail */
  shipments: ShippingNotificationShipment[]
  /** Bestellte Artikel (für Kontext: um welche Bestellung es geht) */
  items?: ShippingNotificationItem[]
  subtotal?: number
  shipping?: number
  total?: number
  accountOrdersUrl?: string
  /** Öffentliche URL des Shop-Logos (z. B. aus site_settings) */
  logoUrl?: string
}

export function ShippingNotificationEmail({
  orderNumber,
  customerName,
  shipments,
  items = [],
  subtotal,
  shipping,
  total,
  accountOrdersUrl,
  logoUrl,
}: ShippingNotificationProps) {
  const isMultiple = shipments.length > 1
  const hasOrderSummary = items.length > 0
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: s.background, color: s.text, fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 520, margin: '0 auto', padding: 32 }}>
          <Section style={{ backgroundColor: s.cardBg, border: `1px solid ${s.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <ShopEmailHeader logoUrl={logoUrl} />
            <Section style={{ padding: '32px 24px' }}>
              <Heading style={{ color: s.text, margin: '0 0 8px', fontSize: 22, fontWeight: 'bold' }}>
                Dein Paket {isMultiple ? 'sind unterwegs' : 'ist unterwegs'}
              </Heading>
              <Text style={{ color: s.textMuted, margin: '6px 0 0', fontSize: 14 }}>
                Bestellung #{orderNumber}
              </Text>
              <Text style={{ color: s.text, fontSize: 16, lineHeight: 1.6, marginTop: 16 }}>
            Hallo {customerName},
          </Text>
          <Text style={{ color: s.textMuted, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
            {isMultiple
              ? 'deine Bestellung wurde in mehreren Paketen versandt. Du kannst die Sendungen mit den folgenden Nummern verfolgen.'
              : 'deine Bestellung wurde versandt. Du kannst die Sendung mit der folgenden Sendungsverfolgungsnummer verfolgen.'}
          </Text>

          {hasOrderSummary && (
            <>
              <Heading as="h2" style={{ color: s.text, fontSize: 18, marginTop: 24, marginBottom: 12 }}>
                Deine Bestellung (Übersicht)
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
                      <Text style={{ color: s.text, margin: 0, fontSize: 14 }}>
                        {item.name}
                      </Text>
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
              {(subtotal != null || total != null) && (
                <Section style={{ marginTop: 12 }}>
                  {subtotal != null && (
                    <Row style={{ padding: '4px 0' }}>
                      <Column><Text style={{ color: s.textMuted, margin: 0, fontSize: 14 }}>Zwischensumme</Text></Column>
                      <Column style={{ textAlign: 'right' }}><Text style={{ color: s.text, margin: 0, fontSize: 14 }}>{subtotal.toFixed(2)} €</Text></Column>
                    </Row>
                  )}
                  {shipping != null && (
                    <Row style={{ padding: '4px 0' }}>
                      <Column><Text style={{ color: s.textMuted, margin: 0, fontSize: 14 }}>Versand</Text></Column>
                      <Column style={{ textAlign: 'right' }}><Text style={{ color: s.text, margin: 0, fontSize: 14 }}>{shipping.toFixed(2)} €</Text></Column>
                    </Row>
                  )}
                  {total != null && (
                    <Row style={{ padding: '8px 0 0' }}>
                      <Column><Text style={{ color: s.text, margin: 0, fontSize: 16, fontWeight: 'bold' }}>Gesamt</Text></Column>
                      <Column style={{ textAlign: 'right' }}><Text style={{ color: s.primary, margin: 0, fontSize: 18, fontWeight: 'bold' }}>{total.toFixed(2)} €</Text></Column>
                    </Row>
                  )}
                </Section>
              )}
            </>
          )}

          <Heading as="h2" style={{ color: s.text, fontSize: 18, marginTop: 24, marginBottom: 12 }}>
            Sendungsverfolgung
          </Heading>
          {shipments.map((ship, index) => (
            <Section
              key={index}
              style={{
                backgroundColor: s.cardBg,
                border: `1px solid ${s.border}`,
                borderRadius: 12,
                padding: 24,
                marginTop: index === 0 ? 24 : 16,
                marginBottom: index === shipments.length - 1 ? 24 : 0,
              }}
            >
              <Text style={{ color: s.textMuted, fontSize: 12, margin: '0 0 8px', textTransform: 'uppercase' }}>
                Sendungsverfolgung {isMultiple ? `(Paket ${index + 1})` : ''} ({ship.trackingCarrier || 'DHL'})
              </Text>
              <Text style={{ color: s.primary, fontSize: 22, fontWeight: 'bold', margin: 0, letterSpacing: 1 }}>
                {ship.trackingNumber}
              </Text>
              <Button
                href={ship.trackingUrl}
                style={{
                  backgroundColor: s.primary,
                  color: s.background,
                  padding: '14px 24px',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  marginTop: 16,
                  textDecoration: 'none',
                }}
              >
                Sendung verfolgen
              </Button>
            </Section>
          ))}

          <Text style={{ color: s.textMuted, fontSize: 14, lineHeight: 1.6, marginTop: 16 }}>
            Sobald {isMultiple ? 'die Pakete' : 'das Paket'} zugestellt wurde, siehst du den Status auch in deinem Kundenkonto.
          </Text>

          {accountOrdersUrl && (
            <Section style={{ marginTop: 24, textAlign: 'center' as const }}>
              <Link
                href={accountOrdersUrl}
                style={{ color: s.primary, fontSize: 14, textDecoration: 'underline' }}
              >
                Zu meinen Bestellungen
              </Link>
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

export async function renderShippingNotificationEmail(props: ShippingNotificationProps): Promise<string> {
  return render(React.createElement(ShippingNotificationEmail, props))
}
