import { Html, Head, Body, Container, Section, Text, Heading, Hr, render } from '@react-email/components'
import * as React from 'react'
import { emailStyles as s } from './email-styles'
import { ShopEmailHeader } from './ShopEmailHeader'
import { ShopEmailFooter } from './ShopEmailFooter'

export interface ReferralSuccessEmailProps {
  referrerName?: string
  /** 200 Treuepunkte oder 10€ Gutschein – Text für die E-Mail */
  rewardText?: string
  logoUrl?: string
}

/**
 * E-Mail an den Werber: „Dein Freund hat bestellt – du erhältst 200 Punkte.“
 */
export function ReferralSuccessEmail({
  referrerName,
  rewardText = '200 Treuepunkte',
  logoUrl,
}: ReferralSuccessEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: s.background, color: s.text, fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 520, margin: '0 auto', padding: 32 }}>
          <ShopEmailHeader logoUrl={logoUrl} />
          <Section style={{ backgroundColor: s.cardBg, border: `1px solid ${s.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '32px 24px' }}>
            <Heading style={{ color: s.text, margin: '0 0 8px', fontSize: 22, fontWeight: 'bold' }}>
              Dein Freund hat bestellt!
            </Heading>
            <Text style={{ color: s.text, fontSize: 16, lineHeight: 1.6 }}>
              {referrerName ? `Hallo ${referrerName},` : 'Hallo,'}
            </Text>
            <Text style={{ color: s.text, fontSize: 16, lineHeight: 1.6 }}>
              Jemand ist über deinen Empfehlungslink zum Shop gekommen und hat eine Bestellung abgeschlossen.
              Dafür sagen wir Danke – und du erhältst <strong>{rewardText}</strong>.
            </Text>
            <Text style={{ color: s.text, fontSize: 16, lineHeight: 1.6 }}>
              Die Punkte findest du in deinem Konto unter „Punkte & Belohnungen“. Du kannst sie beim nächsten Einkauf einlösen.
            </Text>
            <Hr style={{ borderColor: s.border, margin: '20px 0' }} />
            <Text style={{ color: s.textMuted, fontSize: 13 }}>
              Teile weiter – für jeden geworbenen Freund erhältst du die gleiche Belohnung.
            </Text>
          </Section>
          <ShopEmailFooter />
        </Container>
      </Body>
    </Html>
  )
}

export async function renderReferralSuccessEmail(props: ReferralSuccessEmailProps): Promise<string> {
  return render(React.createElement(ReferralSuccessEmail, props))
}
