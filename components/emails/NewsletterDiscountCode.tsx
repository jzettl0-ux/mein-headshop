import {
  Html,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  render,
} from '@react-email/components'
import * as React from 'react'
import { emailStyles as s } from './email-styles'
import { ShopEmailHeader } from './ShopEmailHeader'
import { ShopEmailFooter } from './ShopEmailFooter'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.example.com'

export interface NewsletterDiscountCodeProps {
  discountCode: string
  logoUrl?: string
}

/**
 * E-Mail 1 Tag nach Newsletter-Anmeldung: Willkommens-Rabattcode.
 * Animiert zum Kauf und erinnert an den Shop.
 */
export function NewsletterDiscountCodeEmail({
  discountCode,
  logoUrl,
}: NewsletterDiscountCodeProps) {
  return (
    <Html>
      <Body style={{ backgroundColor: s.background, color: s.text, fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 520, margin: '0 auto', padding: 32 }}>
          <Section style={{ backgroundColor: s.cardBg, border: `1px solid ${s.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <ShopEmailHeader logoUrl={logoUrl} />
            <Section style={{ padding: '32px 24px' }}>
              <Heading style={{ color: s.text, margin: '0 0 8px', fontSize: 22, fontWeight: 'bold' }}>
                Dein Willkommens-Rabatt wartet
              </Heading>
              <Text style={{ color: s.textMuted, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
                Danke, dass du dich für unseren Newsletter angemeldet hast. Wie versprochen: dein persönlicher Rabattcode.
              </Text>
              <Section
                style={{
                  backgroundColor: s.cardBg,
                  border: `2px solid ${s.primary}`,
                  borderRadius: 8,
                  padding: 20,
                  textAlign: 'center' as const,
                  margin: '24px 0',
                }}
              >
                <Text style={{ color: s.textMuted, fontSize: 13, margin: '0 0 4px' }}>
                  Dein Rabattcode
                </Text>
                <Text style={{ color: s.primary, fontSize: 22, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 2, margin: 0 }}>
                  {discountCode}
                </Text>
              </Section>
              <Text style={{ color: s.textMuted, fontSize: 15, lineHeight: 1.6 }}>
                Einfach beim Checkout eingeben – der Rabatt wird automatisch angewendet. Entdecke unsere Neuheiten und Angebote.
              </Text>
              <Section style={{ textAlign: 'center' as const, marginTop: 28 }}>
                <Button
                  href={`${SITE_URL}/shop`}
                  style={{
                    backgroundColor: s.primary,
                    color: '#FFFFFF',
                    padding: '14px 28px',
                    borderRadius: 8,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Zum Shop
                </Button>
              </Section>
              <Text style={{ color: s.textMuted, fontSize: 14, lineHeight: 1.5, marginTop: 24 }}>
                Du erhältst diese E-Mail, weil du dich für unseren Newsletter angemeldet hast. Wir freuen uns, dich regelmäßig mit Tipps und Angeboten zu versorgen.
              </Text>
            </Section>
            <ShopEmailFooter />
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderNewsletterDiscountCodeEmail(props: NewsletterDiscountCodeProps): Promise<string> {
  return render(React.createElement(NewsletterDiscountCodeEmail, props))
}
