import { Html, Head, Body, Container, Section, Text, Button, Heading, Hr, render } from '@react-email/components'
import * as React from 'react'
import { emailStyles as s } from './email-styles'
import { ShopEmailHeader } from './ShopEmailHeader'
import { ShopEmailFooter } from './ShopEmailFooter'

export interface SubscriptionPaymentLinkProps {
  customerName: string
  productName: string
  quantity: number
  orderNumber: string
  checkoutUrl: string
  total: number
  logoUrl?: string
}

export function SubscriptionPaymentLinkEmail({
  customerName,
  productName,
  quantity,
  orderNumber,
  checkoutUrl,
  total,
  logoUrl,
}: SubscriptionPaymentLinkProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: s.background, color: s.text, fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 520, margin: '0 auto', padding: 32 }}>
          <Section style={{ backgroundColor: s.cardBg, border: `1px solid ${s.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <ShopEmailHeader logoUrl={logoUrl} />
            <Section style={{ padding: '32px 24px' }}>
              <Heading style={{ color: s.text, margin: '0 0 8px', fontSize: 22, fontWeight: 'bold' }}>
                Subscribe & Save: Zahlung ausstehend
              </Heading>
              <Text style={{ color: s.text, fontSize: 16, lineHeight: 1.6 }}>
                Hallo {customerName},
              </Text>
              <Text style={{ color: s.textMuted, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
                dein Abo für <strong style={{ color: s.text }}>{productName}</strong> (Menge: {quantity}) ist fällig.
              </Text>
              <Text style={{ color: s.textMuted, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
                Bestellnummer: <strong>#{orderNumber}</strong> · Gesamtbetrag: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(total)}
              </Text>
              <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
                <Button
                  href={checkoutUrl}
                  style={{
                    backgroundColor: s.primary,
                    color: '#fff',
                    padding: '14px 28px',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    textDecoration: 'none',
                  }}
                >
                  Jetzt bezahlen
                </Button>
              </Section>
              <Text style={{ color: s.textMuted, fontSize: 13, lineHeight: 1.6 }}>
                Der Link ist bis zur Bezahlung gültig. Bei Fragen erreichst du uns über den Kontaktbereich.
              </Text>
            </Section>
            <Hr style={{ borderColor: s.border, margin: 0 }} />
            <ShopEmailFooter />
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderSubscriptionPaymentLinkEmail(props: SubscriptionPaymentLinkProps): Promise<string> {
  return render(React.createElement(SubscriptionPaymentLinkEmail, props))
}
