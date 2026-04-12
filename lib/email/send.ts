import { Resend } from 'resend'
import { formatCurrency } from '@/lib/utils/currency'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@adcure.agency'

/**
 * Checks whether Resend is properly configured with a real API key.
 * Placeholder keys (used in development) will return false.
 */
function isEmailConfigured(): boolean {
  const key = process.env.RESEND_API_KEY
  return !!key && !key.startsWith('placeholder_')
}

/** Shared AdCure email HTML wrapper with dark theme branding */
function wrapEmailHtml(content: string): string {
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AdCure</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0E14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0E14;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1A1F2B;border:1px solid #2A3040;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#2D7FF9;letter-spacing:-0.5px;">AdCure</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#4A5568;">Client Portal</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#141920;border-left:1px solid #2A3040;border-right:1px solid #2A3040;padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#1A1F2B;border:1px solid #2A3040;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#4A5568;">
                AdCure Agency &bull; Dit is een automatisch gegenereerde e-mail
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Send an email notifying the client their ad account request was approved.
 */
export async function sendAccountApprovedEmail(data: {
  to: string
  accountName: string
  platform: string
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('[email] Resend not configured — skipping sendAccountApprovedEmail')
    return
  }

  const platformLabel = data.platform.charAt(0).toUpperCase() + data.platform.slice(1)

  const html = wrapEmailHtml(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#FFFFFF;">
      ✅ Je advertentieaccount is goedgekeurd
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#94A3B8;line-height:1.6;">
      Goed nieuws! Je aanvraag voor het volgende advertentieaccount is goedgekeurd door ons team:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1F2B;border:1px solid #2A3040;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px;font-size:12px;color:#4A5568;text-transform:uppercase;letter-spacing:0.05em;">Account naam</p>
          <p style="margin:0;font-size:16px;font-weight:600;color:#FFFFFF;">${data.accountName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 20px;">
          <p style="margin:0 0 8px;font-size:12px;color:#4A5568;text-transform:uppercase;letter-spacing:0.05em;">Platform</p>
          <p style="margin:0;font-size:16px;font-weight:600;color:#2D7FF9;">${platformLabel}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.6;">
      Je kunt nu je advertentieaccount beheren via het AdCure Client Portal.
    </p>
  `)

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `✅ Advertentieaccount goedgekeurd: ${data.accountName}`,
      html,
    })
  } catch (err) {
    // Log but don't throw — email failure must not block core functionality
    console.error('[email] sendAccountApprovedEmail failed:', err)
  }
}

/**
 * Send an email notifying the client their ad account request was rejected.
 */
export async function sendAccountRejectedEmail(data: {
  to: string
  accountName: string
  rejectionReason: string
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('[email] Resend not configured — skipping sendAccountRejectedEmail')
    return
  }

  const html = wrapEmailHtml(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#FFFFFF;">
      ❌ Je advertentieaccount-aanvraag is afgewezen
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#94A3B8;line-height:1.6;">
      Helaas kunnen we je aanvraag voor <strong style="color:#FFFFFF;">${data.accountName}</strong> op dit moment niet goedkeuren.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1F2B;border:1px solid #EF4444;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px;font-size:12px;color:#EF4444;text-transform:uppercase;letter-spacing:0.05em;">Reden van afwijzing</p>
          <p style="margin:0;font-size:15px;color:#FFFFFF;line-height:1.5;">${data.rejectionReason}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.6;">
      Heb je vragen? Neem contact op met ons team voor meer informatie.
    </p>
  `)

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `❌ Advertentieaccount-aanvraag afgewezen: ${data.accountName}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendAccountRejectedEmail failed:', err)
  }
}

/**
 * Send an email confirming a wallet deposit was approved.
 */
export async function sendDepositApprovedEmail(data: {
  to: string
  amountCents: number
  newBalanceCents: number
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('[email] Resend not configured — skipping sendDepositApprovedEmail')
    return
  }

  const amount = formatCurrency(data.amountCents)
  const newBalance = formatCurrency(data.newBalanceCents)

  const html = wrapEmailHtml(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#FFFFFF;">
      ✅ Storting goedgekeurd
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#94A3B8;line-height:1.6;">
      Je storting is goedgekeurd en bijgeschreven op je wallet.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1F2B;border:1px solid #2A3040;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #2A3040;">
          <p style="margin:0 0 4px;font-size:12px;color:#4A5568;text-transform:uppercase;letter-spacing:0.05em;">Bedrag gestort</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#10B981;">${amount}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#4A5568;text-transform:uppercase;letter-spacing:0.05em;">Nieuw saldo</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;">${newBalance}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.6;">
      Je kunt je saldo en factuur bekijken via het AdCure Client Portal.
    </p>
  `)

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `✅ Storting goedgekeurd: ${amount}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendDepositApprovedEmail failed:', err)
  }
}

/**
 * Send an email notifying the client their deposit was rejected.
 */
export async function sendDepositRejectedEmail(data: {
  to: string
  amountCents: number
  reason: string
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('[email] Resend not configured — skipping sendDepositRejectedEmail')
    return
  }

  const amount = formatCurrency(data.amountCents)

  const html = wrapEmailHtml(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#FFFFFF;">
      ❌ Storting afgewezen
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#94A3B8;line-height:1.6;">
      Je storting van <strong style="color:#FFFFFF;">${amount}</strong> is helaas afgewezen.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1F2B;border:1px solid #EF4444;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px;font-size:12px;color:#EF4444;text-transform:uppercase;letter-spacing:0.05em;">Reden</p>
          <p style="margin:0;font-size:15px;color:#FFFFFF;line-height:1.5;">${data.reason}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.6;">
      Neem contact op met ons team als je vragen hebt of een nieuwe storting wilt aanvragen.
    </p>
  `)

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `❌ Storting afgewezen: ${amount}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendDepositRejectedEmail failed:', err)
  }
}

/**
 * Send an email notifying the client a new invoice is available.
 */
export async function sendInvoiceEmail(data: {
  to: string
  invoiceNumber: string
  amountCents: number
  totalCents: number
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('[email] Resend not configured — skipping sendInvoiceEmail')
    return
  }

  const amount = formatCurrency(data.amountCents)
  const total = formatCurrency(data.totalCents)

  const html = wrapEmailHtml(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#FFFFFF;">
      📄 Nieuwe factuur beschikbaar
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:#94A3B8;line-height:1.6;">
      Er is een nieuwe factuur voor je aangemaakt.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A1F2B;border:1px solid #2A3040;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #2A3040;">
          <p style="margin:0 0 4px;font-size:12px;color:#4A5568;text-transform:uppercase;letter-spacing:0.05em;">Factuurnummer</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#2D7FF9;">${data.invoiceNumber}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #2A3040;">
          <p style="margin:0 0 4px;font-size:12px;color:#4A5568;text-transform:uppercase;letter-spacing:0.05em;">Bedrag (excl. BTW)</p>
          <p style="margin:0;font-size:16px;font-weight:600;color:#FFFFFF;">${amount}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:12px;color:#4A5568;text-transform:uppercase;letter-spacing:0.05em;">Totaal (incl. BTW)</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#10B981;">${total}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.6;">
      Bekijk en download je factuur via het AdCure Client Portal.
    </p>
  `)

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `📄 Factuur ${data.invoiceNumber} — ${total}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendInvoiceEmail failed:', err)
  }
}
