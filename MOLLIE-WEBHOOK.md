# Mollie Webhook – „URL is unreachable“

**Aktuell:** Beim Testen mit localhost wird **keine** Webhook-URL an Mollie übergeben – du kannst den Checkout und die Zahlung normal testen. Nach der Zahlung wird der Webhook nicht aufgerufen (Bestellung bleibt „pending“, keine E-Mail/Rechnung automatisch). Für den Live-Betrieb die Schritte unten umsetzen.

---

Mollie ruft nach einer Zahlung deine **Webhook-URL** auf. Dafür muss die URL **öffentlich erreichbar** sein. `http://localhost:3000` ist von den Mollie-Servern aus nicht erreichbar.

## Lösung 1: Produktion / Deployment

Sobald der Shop unter einer öffentlichen URL läuft (z. B. Vercel, Netlify, eigener Server):

1. In der **Umgebung** (z. B. Vercel Environment Variables) setzen:
   - `NEXT_PUBLIC_SITE_URL=https://deine-domain.de` (oder z. B. `https://mein-headshop.vercel.app`)
2. Die Webhook-URL ist dann automatisch: `https://deine-domain.de/api/payment/webhook`
3. Kein weiterer Schritt nötig.

## Lösung 2: Lokal testen mit Tunnel

Wenn du **lokal** (localhost) testen willst, braucht Mollie eine öffentliche URL zu deinem Rechner. Dafür eignet sich ein Tunnel:

### Mit ngrok (Beispiel)

1. [ngrok](https://ngrok.com/) installieren und starten:
   ```bash
   ngrok http 3000
   ```
2. ngrok zeigt eine URL wie `https://abc123.ngrok-free.app`.
3. In **`.env.local`** eintragen:
   ```env
   MOLLIE_WEBHOOK_URL=https://abc123.ngrok-free.app/api/payment/webhook
   ```
4. Dev-Server neu starten (`npm run dev`) und erneut zur Kasse gehen.

**Hinweis:** Die ngrok-URL ändert sich bei jedem Start (bei kostenlosem Plan). Nach jedem ngrok-Neustart `MOLLIE_WEBHOOK_URL` in `.env.local` anpassen.

### Alternative: Cloudflare Tunnel, localtunnel, etc.

Jeder Dienst, der deinen lokalen Port (z. B. 3000) unter einer öffentlichen HTTPS-URL erreichbar macht, funktioniert. Diese URL + `/api/payment/webhook` als `MOLLIE_WEBHOOK_URL` eintragen.

## Zusammenfassung

| Umgebung   | Was setzen |
|-----------|------------------------------------------|
| Produktion | `NEXT_PUBLIC_SITE_URL=https://deine-domain.de` |
| Lokal      | `MOLLIE_WEBHOOK_URL=https://<tunnel-url>/api/payment/webhook` |

Wenn du auf localhost bist und **keine** `MOLLIE_WEBHOOK_URL` gesetzt hast, zeigt der Checkout eine klare Fehlermeldung mit diesem Hinweis.
