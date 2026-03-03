import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { generateInvoicePdf } from '@/lib/invoice-pdf'

/**
 * GET /api/account/orders/[id]/invoice
 * Liefert die PDF-Rechnung oder XRechnung XML.
 * Query: ?format=xml → XRechnung (falls vorhanden)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, user_id, invoice_url, invoice_xml_url, order_number, created_at, customer_name, customer_email, shipping_address, billing_address, payment_method, subtotal, shipping_cost, discount_amount, total, has_adult_items, payment_status')
      .eq('id', params.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Kein Zugriff auf diese Bestellung' }, { status: 403 })
    }

    const orderNumber = order.order_number
    const formatXml = request.nextUrl.searchParams.get('format') === 'xml'

    // XRechnung XML (falls format=xml und vorhanden)
    if (formatXml && (order as { invoice_xml_url?: string | null }).invoice_xml_url && hasSupabaseAdmin()) {
      const admin = createSupabaseAdmin()
      const xmlUrl = (order as { invoice_xml_url: string }).invoice_xml_url
      const { data: xmlData, error: xmlErr } = await admin.storage.from('invoices').download(xmlUrl)
      if (!xmlErr && xmlData) {
        const bytes = await xmlData.arrayBuffer()
        return new NextResponse(bytes, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="XRechnung-${orderNumber || params.id}.xml"`,
          },
        })
      }
    }

    const filename = `Rechnung-${orderNumber || params.id}.pdf`

    // 1) Rechnung liegt schon in Storage (z. B. vom Mollie-Webhook)
    if (order.invoice_url && hasSupabaseAdmin()) {
      const admin = createSupabaseAdmin()
      const { data: signed, error: signError } = await admin.storage
        .from('invoices')
        .createSignedUrl(order.invoice_url, 60)

      if (!signError && signed?.signedUrl) {
        const res = await fetch(signed.signedUrl)
        if (res.ok) {
          const pdfBytes = await res.arrayBuffer()
          return new NextResponse(pdfBytes, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          })
        }
      }
    }

    // 2) PDF on-the-fly erzeugen (für alle Bestellungen – auch wenn noch nicht als „bezahlt“ markiert)
    const [{ data: items }, { data: logoRow }] = await Promise.all([
      supabase.from('order_items').select('product_name, quantity, price, total').eq('order_id', params.id),
      supabase.from('site_settings').select('value').eq('key', 'logo_url').maybeSingle(),
    ])
    const logoUrl = logoRow?.value?.trim() ? String(logoRow.value).trim() : undefined

    const invoicePayload = {
      order_number: orderNumber,
      created_at: order.created_at,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      billing_address: (order.billing_address as Record<string, unknown>) || (order.shipping_address as Record<string, unknown>) || {},
      shipping_address: order.shipping_address,
      payment_method: order.payment_method || 'mollie',
      items: (items || []).map((i: { product_name: string; quantity: number; price: number; total: number }) => ({
        product_name: i.product_name,
        quantity: i.quantity,
        price: Number(i.price),
        total: Number(i.total),
      })),
      subtotal: Number(order.subtotal),
      shipping_cost: Number(order.shipping_cost),
      discount_amount: Number(order.discount_amount) || 0,
      total: Number(order.total),
      has_adult_items: Boolean(order.has_adult_items),
    }

    let pdfBytes: Uint8Array
    try {
      pdfBytes = await generateInvoicePdf(invoicePayload, { logoUrl })
    } catch (genError: any) {
      console.error('Invoice PDF generation error', genError)
      return NextResponse.json(
        { error: 'Rechnung konnte nicht erstellt werden: ' + (genError?.message || 'Unbekannter Fehler') },
        { status: 500 }
      )
    }

    // Optional: in Storage speichern (nur bei bezahlten Bestellungen), damit Webhook/Sync sie finden
    const isPaid = order.payment_status === 'paid'
    if (isPaid && hasSupabaseAdmin()) {
      const admin = createSupabaseAdmin()
      const fileName = `rechnung-${orderNumber}.pdf`
      const { error: uploadError } = await admin.storage
        .from('invoices')
        .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true })
      if (!uploadError) {
        await admin.from('orders').update({ invoice_url: fileName }).eq('id', params.id)
      }
    }

    return new NextResponse(pdfBytes as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    console.error('Invoice route error', e)
    return NextResponse.json(
      { error: e?.message || 'Fehler' },
      { status: 500 }
    )
  }
}
