/**
 * Email-Templates für Bestellbestätigungen
 * Kann später mit Resend, SendGrid oder Supabase Edge Functions verwendet werden
 */

interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  shipping: number
  total: number
  shippingAddress: {
    street: string
    house_number: string
    postal_code: string
    city: string
  }
  hasAdultItems: boolean
  /** Link zum Kundenbereich (Rechnung herunterladen) */
  accountOrdersUrl?: string
}

export function generateOrderConfirmationEmail(data: OrderEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bestellbestätigung - Premium Headshop</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0A0A0A;
      color: #FFFFFF;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1A1A1A;
      border: 1px solid #2A2A2A;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #D4AF37 0%, #39FF14 100%);
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #0A0A0A;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 32px;
    }
    .order-number {
      background-color: #2A2A2A;
      border: 1px solid #D4AF37;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      margin: 24px 0;
    }
    .order-number strong {
      color: #D4AF37;
      font-size: 24px;
    }
    .info-box {
      background-color: #2A2A2A;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .adult-warning {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .items-table th {
      text-align: left;
      padding: 12px;
      background-color: #2A2A2A;
      color: #8A8A8A;
      font-size: 12px;
      text-transform: uppercase;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #2A2A2A;
    }
    .totals {
      background-color: #2A2A2A;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      color: #8A8A8A;
    }
    .totals-row.total {
      border-top: 2px solid #D4AF37;
      padding-top: 16px;
      margin-top: 8px;
      font-size: 20px;
      font-weight: bold;
      color: #D4AF37;
    }
    .footer {
      background-color: #0A0A0A;
      padding: 24px;
      text-align: center;
      color: #8A8A8A;
      font-size: 12px;
    }
    a {
      color: #D4AF37;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🌿 Bestellbestätigung</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <h2 style="color: #FFFFFF; margin-top: 0;">Hallo ${data.customerName},</h2>
      <p style="color: #8A8A8A; line-height: 1.6;">
        vielen Dank für deine Bestellung bei <strong style="color: #D4AF37;">Premium Headshop</strong>!
        Wir haben deine Bestellung erhalten und werden sie schnellstmöglich bearbeiten.
      </p>

      <!-- Order Number -->
      <div class="order-number">
        <p style="margin: 0; color: #8A8A8A; font-size: 14px;">Deine Bestellnummer</p>
        <strong>${data.orderNumber}</strong>
      </div>

      ${data.hasAdultItems ? `
      <!-- Adult Warning -->
      <div class="adult-warning">
        <p style="margin: 0; color: #EF4444; font-weight: bold;">
          🔞 Altersverifikation erforderlich
        </p>
        <p style="margin: 8px 0 0; color: #EF4444; font-size: 14px;">
          Deine Bestellung enthält Produkte mit Altersbeschränkung. Bei der Zustellung 
          ist eine Identitätsprüfung durch DHL erforderlich. Bitte halte deinen Ausweis bereit.
        </p>
      </div>
      ` : ''}

      <!-- Items -->
      <h3 style="color: #FFFFFF; margin-top: 32px;">Bestellte Artikel</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>Artikel</th>
            <th>Menge</th>
            <th style="text-align: right;">Preis</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td style="color: #FFFFFF;">${item.name}</td>
              <td style="color: #8A8A8A;">${item.quantity}x</td>
              <td style="color: #FFFFFF; text-align: right;">
                ${(item.price * item.quantity).toFixed(2)} €
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals">
        <div class="totals-row">
          <span>Zwischensumme</span>
          <span>${data.subtotal.toFixed(2)} €</span>
        </div>
        <div class="totals-row">
          <span>Versandkosten</span>
          <span>${data.shipping.toFixed(2)} €</span>
        </div>
        ${data.hasAdultItems ? `
        <div class="totals-row" style="color: #EF4444;">
          <span>DHL Ident-Check</span>
          <span>+ 2,00 €</span>
        </div>
        ` : ''}
        <div class="totals-row total">
          <span>Gesamt</span>
          <span>${data.total.toFixed(2)} €</span>
        </div>
      </div>

      <!-- Shipping Address -->
      <div class="info-box">
        <h4 style="color: #FFFFFF; margin: 0 0 12px;">📦 Lieferadresse</h4>
        <p style="color: #8A8A8A; margin: 0; line-height: 1.6;">
          ${data.customerName}<br>
          ${data.shippingAddress.street} ${data.shippingAddress.house_number}<br>
          ${data.shippingAddress.postal_code} ${data.shippingAddress.city}
        </p>
      </div>

      ${data.accountOrdersUrl ? `
      <div class="info-box">
        <h4 style="color: #FFFFFF; margin: 0 0 12px;">📄 Rechnung</h4>
        <p style="color: #8A8A8A; margin: 0; line-height: 1.6;">
          Deine Rechnung kannst du jederzeit in deinem Kundenbereich als PDF abrufen:
          <a href="${data.accountOrdersUrl}" style="color: #D4AF37;">Rechnung im Kundenbereich anzeigen</a>
        </p>
      </div>
      ` : ''}

      <!-- Next Steps -->
      <div class="info-box">
        <h4 style="color: #FFFFFF; margin: 0 0 12px;">📬 Wie geht es weiter?</h4>
        <ul style="color: #8A8A8A; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Wir bearbeiten deine Bestellung innerhalb von 24 Stunden</li>
          <li>Du erhältst eine separate Email mit der Tracking-Nummer</li>
          <li>Die Lieferzeit beträgt 2-5 Werktage</li>
          ${data.hasAdultItems ? '<li><strong style="color: #EF4444;">Ausweis bei Zustellung bereithalten!</strong></li>' : ''}
        </ul>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account" 
           style="display: inline-block; background-color: #D4AF37; color: #0A0A0A; 
                  padding: 12px 32px; border-radius: 8px; font-weight: bold; 
                  text-decoration: none;">
          Bestellung verfolgen
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        Bei Fragen zur Bestellung:<br>
        <a href="mailto:support@premium-headshop.de">support@premium-headshop.de</a>
      </p>
      <p style="margin-top: 16px;">
        © ${new Date().getFullYear()} Premium Headshop. Alle Rechte vorbehalten.
      </p>
      <p style="margin-top: 8px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/impressum">Impressum</a> • 
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/privacy">Datenschutz</a> • 
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/terms">AGB</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function generateShippingNotificationEmail(orderNumber: string, trackingNumber: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Deine Bestellung wurde versandt - Premium Headshop</title>
</head>
<body style="font-family: sans-serif; background-color: #0A0A0A; color: #FFFFFF; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #39FF14 0%, #D4AF37 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: #0A0A0A; font-size: 28px;">📦 Dein Paket ist unterwegs!</h1>
    </div>
    
    <div style="padding: 32px;">
      <h2 style="color: #FFFFFF;">Hallo,</h2>
      <p style="color: #8A8A8A; line-height: 1.6;">
        gute Neuigkeiten! Deine Bestellung <strong style="color: #D4AF37;">#${orderNumber}</strong> 
        wurde soeben versandt und ist auf dem Weg zu dir.
      </p>

      <div style="background-color: #2A2A2A; border: 1px solid #D4AF37; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
        <p style="margin: 0; color: #8A8A8A; font-size: 14px;">Tracking-Nummer</p>
        <strong style="color: #D4AF37; font-size: 20px;">${trackingNumber}</strong>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${trackingNumber}" 
           style="display: inline-block; background-color: #D4AF37; color: #0A0A0A; 
                  padding: 12px 32px; border-radius: 8px; font-weight: bold; text-decoration: none;">
          Sendung verfolgen
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}
