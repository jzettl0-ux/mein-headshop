import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Img,
  Row,
  Column,
} from '@react-email/components'
import * as React from 'react'
import { ShopEmailHeader } from './ShopEmailHeader'
import { ShopEmailFooter } from './ShopEmailFooter'
import { render } from '@react-email/components'
import { emailStyles as s } from './email-styles'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://premium-headshop.de'

export interface DropRadarRestockProps {
  productName: string
  productUrl: string
  productImageUrl?: string | null
  productPrice?: number | null
  logoUrl?: string
}

export function DropRadarRestockEmail({
  productName,
  productUrl,
  productImageUrl,
  productPrice,
  logoUrl,
}: DropRadarRestockProps) {
  const formatPrice = (euros: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(euros)
  }

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: s.background, color: s.text, fontFamily: 'system-ui,-apple-system,sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px' }}>
          <Section
            style={{
              backgroundColor: s.cardBg,
              border: `1px solid ${s.border}`,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            <ShopEmailHeader logoUrl={logoUrl} />
            <Section style={{ padding: '32px 24px' }}>
              <Heading
                style={{
                  color: s.text,
                  margin: '0 0 8px',
                  fontSize: 22,
                  fontWeight: 'bold',
                }}
              >
                Dein Wunschprodukt ist wieder da
              </Heading>
              <Text style={{ color: s.textMuted, fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                Du hast dich für eine Benachrichtigung registriert – und jetzt ist es soweit:
              </Text>

              <Section
                style={{
                  backgroundColor: s.background,
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 24,
                  border: `1px solid ${s.border}`,
                }}
              >
                <Row>
                  {productImageUrl && (
                    <Column width={80} style={{ paddingRight: 16, verticalAlign: 'top' }}>
                      <Img
                        src={productImageUrl}
                        alt={productName}
                        width={72}
                        height={72}
                        style={{ borderRadius: 8, objectFit: 'cover' }}
                      />
                    </Column>
                  )}
                  <Column>
                    <Text style={{ margin: 0, fontSize: 16, fontWeight: 600, color: s.text }}>
                      {productName}
                    </Text>
                    {productPrice != null && productPrice > 0 && (
                      <Text style={{ margin: '8px 0 0', fontSize: 15, color: s.primary, fontWeight: 600 }}>
                        {formatPrice(Number(productPrice))}
                      </Text>
                    )}
                  </Column>
                </Row>
              </Section>

              <Text style={{ color: s.text, fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
                Der Artikel ist wieder auf Lager – sicher dir dein Exemplar, bevor es erneut ausverkauft ist.
              </Text>

              <Button
                href={productUrl}
                style={{
                  backgroundColor: s.primaryDark,
                  color: '#fff',
                  padding: '14px 28px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                Zum Produkt
              </Button>
            </Section>
            <ShopEmailFooter />
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderDropRadarRestockEmail(props: DropRadarRestockProps): Promise<string> {
  return render(React.createElement(DropRadarRestockEmail, props))
}
