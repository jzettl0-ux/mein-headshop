import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
} from '@react-email/components'
import * as React from 'react'
import { render } from '@react-email/components'
import { emailStyles as s } from './email-styles'
import { ShopEmailHeader } from './ShopEmailHeader'
import { ShopEmailFooter } from './ShopEmailFooter'

export interface ProductRecallNotificationProps {
  customerName: string
  recallReason: string
  productName?: string
  actionRequired?: string
  publicAnnouncementUrl?: string
  regulatoryAuthority?: string
  logoUrl?: string
}

const ACTION_LABELS: Record<string, string> = {
  DESTROY: 'Bitte vernichten Sie das Produkt.',
  RETURN_TO_VENDOR: 'Bitte senden Sie das Produkt zurück.',
  SOFTWARE_UPDATE: 'Bitte führen Sie ein Software-Update durch.',
}

export function ProductRecallNotificationEmail({
  customerName,
  recallReason,
  productName,
  actionRequired,
  publicAnnouncementUrl,
  regulatoryAuthority,
  logoUrl,
}: ProductRecallNotificationProps) {
  const actionText = actionRequired && ACTION_LABELS[actionRequired]
    ? ACTION_LABELS[actionRequired]
    : 'Bitte befolgen Sie die Anweisungen der zuständigen Behörde.'

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: s.background, color: s.text, fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 520, margin: '0 auto', padding: 32 }}>
          <Section style={{ backgroundColor: s.cardBg, border: `1px solid ${s.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <ShopEmailHeader logoUrl={logoUrl} />
            <Section style={{ padding: '32px 24px' }}>
              <Heading style={{ color: '#dc2626', margin: '0 0 8px', fontSize: 22, fontWeight: 'bold' }}>
                Wichtige Produktrückruf-Information
              </Heading>
              <Text style={{ color: s.textMuted, margin: '6px 0 0', fontSize: 14 }}>
                Offizielle Sicherheitswarnung
              </Text>
              <Text style={{ color: s.text, fontSize: 16, lineHeight: 1.6, marginTop: 16 }}>
                Hallo {customerName},
              </Text>
              <Text style={{ color: s.text, fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
                Sie haben ein Produkt bei uns bestellt, das von einem Rückruf betroffen ist. Aus Sicherheitsgründen bitten wir Sie, die folgenden Hinweise zu beachten.
              </Text>
              <Section
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: 16,
                  marginTop: 20,
                }}
              >
                <Text style={{ color: s.text, margin: 0, fontSize: 15, fontWeight: 'bold' }}>
                  Rückruf-Grund
                </Text>
                <Text style={{ color: s.text, margin: '8px 0 0', fontSize: 15, lineHeight: 1.5 }}>
                  {recallReason}
                </Text>
                {productName && (
                  <Text style={{ color: s.textMuted, margin: '12px 0 0', fontSize: 14 }}>
                    Betroffenes Produkt: {productName}
                  </Text>
                )}
                {regulatoryAuthority && (
                  <Text style={{ color: s.textMuted, margin: '4px 0 0', fontSize: 14 }}>
                    Zuständige Behörde: {regulatoryAuthority}
                  </Text>
                )}
              </Section>
              <Text style={{ color: s.text, fontSize: 15, lineHeight: 1.6, marginTop: 20, fontWeight: 'bold' }}>
                Erforderliche Maßnahme
              </Text>
              <Text style={{ color: s.text, fontSize: 15, lineHeight: 1.6, marginTop: 6 }}>
                {actionText}
              </Text>
              {publicAnnouncementUrl && (
                <Section style={{ marginTop: 20 }}>
                  <Link
                    href={publicAnnouncementUrl}
                    style={{ color: s.primary, textDecoration: 'underline', fontSize: 14 }}
                  >
                    Weitere Informationen zum Rückruf
                  </Link>
                </Section>
              )}
              <Text style={{ color: s.textMuted, fontSize: 14, lineHeight: 1.5, marginTop: 24 }}>
                Bei Fragen stehen wir Ihnen gerne zur Verfügung. Bitte antworten Sie auf diese E-Mail oder kontaktieren Sie unseren Kundenservice.
              </Text>
            </Section>
            <ShopEmailFooter />
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export async function renderProductRecallNotificationEmail(props: ProductRecallNotificationProps): Promise<string> {
  return render(React.createElement(ProductRecallNotificationEmail, props))
}
