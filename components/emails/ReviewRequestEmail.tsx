import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
} from '@react-email/components'
import * as React from 'react'
import { render } from '@react-email/components'
import { emailStyles as s } from './email-styles'

export interface ReviewRequestEmailProps {
  orderNumber: string
  customerName: string
  /** Link zu Kundenkonto / Bestellungen (dort können Produkte bewertet werden) */
  reviewUrl: string
  logoUrl?: string
}

export function ReviewRequestEmail({
  orderNumber,
  customerName,
  reviewUrl,
  logoUrl,
}: ReviewRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: s.background, color: s.text, fontFamily: 'system-ui,-apple-system,sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
          <Section
            style={{
              backgroundColor: s.cardBg,
              border: `1px solid ${s.border}`,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            {logoUrl ? (
              <Section style={{ background: s.headerBg, padding: '28px 24px', textAlign: 'center' as const }}>
                <img src={logoUrl} alt="" width={140} height={42} style={{ display: 'inline-block', maxHeight: 42, width: 'auto', objectFit: 'contain' }} />
              </Section>
            ) : (
              <Section style={{ background: s.headerBg, padding: '28px 32px 20px' }}>
                <Text style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '0.02em', color: s.text }}>
                  {process.env.NEXT_PUBLIC_SITE_NAME || 'Premium Headshop'}
                </Text>
              </Section>
            )}

            <Section style={{ padding: '40px 32px 48px' }}>
              <Heading
                style={{
                  color: s.text,
                  margin: '0 0 12px',
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                }}
              >
                Wie hat dir deine Bestellung gefallen?
              </Heading>
              <Text style={{ color: s.textMuted, margin: '0 0 24px', fontSize: 15, lineHeight: 1.65 }}>
                Bestellung #{orderNumber}
              </Text>

              <Text style={{ color: s.text, fontSize: 16, lineHeight: 1.7, margin: '0 0 24px' }}>
                Hallo {customerName},
              </Text>
              <Text style={{ color: s.text, fontSize: 15, lineHeight: 1.75, margin: '0 0 32px' }}>
                deine Bestellung ist seit einigen Tagen unterwegs zu dir. Wenn du deine Artikel bereits erhalten hast, würden wir uns über eine kurze Bewertung freuen – sie hilft anderen Kunden und uns, das Sortiment weiter zu verbessern.
              </Text>

              <Button
                href={reviewUrl}
                style={{
                  backgroundColor: s.primary,
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Zu meinen Bestellungen & Bewertungen
              </Button>

              <Text style={{ color: s.textMuted, fontSize: 13, lineHeight: 1.6, marginTop: 32 }}>
                In deinem Kundenkonto siehst du deine Bestellung und kannst jedes Produkt mit wenigen Klicks bewerten. Vielen Dank.
              </Text>

              <Text style={{ margin: '28px 0 0', fontSize: 15, color: s.primary, fontWeight: 600 }}>
                Dein Team von {process.env.NEXT_PUBLIC_SITE_NAME || 'Premium Headshop'}
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderReviewRequestEmail(props: ReviewRequestEmailProps): Promise<string> {
  return render(React.createElement(ReviewRequestEmail, props))
}
