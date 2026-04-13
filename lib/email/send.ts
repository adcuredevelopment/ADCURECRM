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

// =====================================================
// Application emails
// =====================================================

/**
 * Sent to applicant after submitting sign-up form
 */
export async function sendApplicationReceivedEmail(data: {
  to: string
  fullName: string
  companyName: string
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('[email] sendApplicationReceivedEmail skipped: RESEND_API_KEY not configured')
    return
  }

  const html = wrapEmailHtml(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#FFFFFF;">
      Aanvraag ontvangen ✅
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:#94A3B8;line-height:1.6;">
      Beste ${data.fullName},
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#94A3B8;line-height:1.6;">
      We hebben je aanvraag voor <strong style="color:#FFFFFF;">${data.companyName}</strong> ontvangen.
      Ons team bekijkt je aanvraag zo snel mogelijk — dit duurt meestal <strong style="color:#FFFFFF;">minder dan 24 uur</strong>.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;line-height:1.6;">
      Je ontvangt een email zodra je aanvraag is beoordeeld.
    </p>
    <p style="margin:0;font-size:14px;color:#94A3B8;">
      Met vriendelijke groet,<br/>
      <strong style="color:#FFFFFF;">Het AdCure Team</strong>
    </p>
  `)

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Aanvraag ontvangen — ${data.companyName}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendApplicationReceivedEmail failed:', err)
  }
}

/**
 * Sent to admin when a new application is submitted
 */
export async function sendAdminNewApplicationEmail(data: {
  companyName: string
  fullName: string
  email: string
  phone: string
  kvkNumber: string
  vatNumber: string
  applicationId: string
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.warn('[email] sendAdminNewApplicationEmail skipped: ADMIN_EMAIL not set')
    return
  }
  if (!isEmailConfigured()) {
    console.warn('[email] sendAdminNewApplicationEmail skipped: RESEND_API_KEY not configured')
    return
  }

  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/agency/account-applications`

  const html = wrapEmailHtml(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#FFFFFF;">
      Nieuwe accountaanvraag 🔔
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#94A3B8;">
      Er is een nieuwe aanvraag binnengekomen die je aandacht vereist.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2A3040;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr style="background-color:#141920;">
        <td style="padding:12px 16px;font-size:12px;color:#4A5568;width:140px;">Bedrijf</td>
        <td style="padding:12px 16px;font-size:14px;color:#FFFFFF;font-weight:600;">${data.companyName}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:12px;color:#4A5568;border-top:1px solid #2A3040;">Contactpersoon</td>
        <td style="padding:12px 16px;font-size:14px;color:#94A3B8;border-top:1px solid #2A3040;">${data.fullName}</td>
      </tr>
      <tr style="background-color:#141920;">
        <td style="padding:12px 16px;font-size:12px;color:#4A5568;border-top:1px solid #2A3040;">Email</td>
        <td style="padding:12px 16px;font-size:14px;color:#94A3B8;border-top:1px solid #2A3040;">${data.email}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:12px;color:#4A5568;border-top:1px solid #2A3040;">Telefoon</td>
        <td style="padding:12px 16px;font-size:14px;color:#94A3B8;border-top:1px solid #2A3040;">${data.phone}</td>
      </tr>
      <tr style="background-color:#141920;">
        <td style="padding:12px 16px;font-size:12px;color:#4A5568;border-top:1px solid #2A3040;">KVK</td>
        <td style="padding:12px 16px;font-size:14px;color:#94A3B8;border-top:1px solid #2A3040;">${data.kvkNumber}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:12px;color:#4A5568;border-top:1px solid #2A3040;">BTW</td>
        <td style="padding:12px 16px;font-size:14px;color:#94A3B8;border-top:1px solid #2A3040;">${data.vatNumber}</td>
      </tr>
    </table>
    <a href="${reviewUrl}" style="display:inline-block;background-color:#2D7FF9;color:#FFFFFF;padding:12px 24px;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
      Bekijk aanvraag →
    </a>
  `)

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `Nieuwe aanvraag: ${data.companyName}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendAdminNewApplicationEmail failed:', err)
  }
}

/**
 * Sent to applicant when their application is approved
 */
export async function sendApplicationApprovedEmail(data: {
  to: string
  fullName: string
  companyName: string
  loginUrl: string
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('[email] sendApplicationApprovedEmail skipped: RESEND_API_KEY not configured')
    return
  }

  const html = wrapEmailHtml(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#10B981;">
      Account Goedgekeurd! 🎉
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:#94A3B8;line-height:1.6;">
      Beste ${data.fullName},
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#94A3B8;line-height:1.6;">
      Geweldig nieuws! Je account voor <strong style="color:#FFFFFF;">${data.companyName}</strong> is goedgekeurd.
      Je kunt nu aan de slag met het AdCure Client Portal.
    </p>
    <div style="background-color:#141920;border:1px solid #2A3040;border-radius:8px;padding:20px;margin:0 0 24px;">
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#FFFFFF;">Volgende stappen:</h3>
      <ol style="margin:0;padding-left:20px;color:#94A3B8;font-size:14px;line-height:2;">
        <li>Klik op de knop hieronder om je wachtwoord in te stellen</li>
        <li>Log in op het portal</li>
        <li>Start met het aanvragen van advertentieaccounts</li>
      </ol>
    </div>
    <a href="${data.loginUrl}" style="display:inline-block;background-color:#2D7FF9;color:#FFFFFF;padding:12px 24px;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
      Wachtwoord Instellen →
    </a>
    <p style="margin:24px 0 0;font-size:14px;color:#94A3B8;">
      Welkom bij AdCure!<br/>
      <strong style="color:#FFFFFF;">Het AdCure Team</strong>
    </p>
  `)

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `✅ Je account is goedgekeurd — Welkom bij AdCure!`,
      html,
    })
  } catch (err) {
    console.error('[email] sendApplicationApprovedEmail failed:', err)
  }
}

/**
 * Sent to applicant when their application is rejected
 */
export async function sendApplicationRejectedEmail(data: {
  to: string
  fullName: string
  companyName: string
  rejectionReason: string
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('[email] sendApplicationRejectedEmail skipped: RESEND_API_KEY not configured')
    return
  }

  const supportEmail = process.env.SUPPORT_EMAIL ?? 'support@adcure.agency'

  const html = wrapEmailHtml(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#FFFFFF;">
      Accountaanvraag Afgewezen
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:#94A3B8;line-height:1.6;">
      Beste ${data.fullName},
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#94A3B8;line-height:1.6;">
      Helaas kunnen we je aanvraag voor <strong style="color:#FFFFFF;">${data.companyName}</strong> op dit moment niet goedkeuren.
    </p>
    <div style="background-color:#1A0A0A;border-left:4px solid #EF4444;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#EF4444;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Reden</p>
      <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.6;">${data.rejectionReason}</p>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:#94A3B8;line-height:1.6;">
      Denk je dat dit een vergissing is? Neem dan contact op via
      <a href="mailto:${supportEmail}" style="color:#2D7FF9;text-decoration:none;">${supportEmail}</a>.
    </p>
    <p style="margin:0;font-size:14px;color:#94A3B8;">
      Met vriendelijke groet,<br/>
      <strong style="color:#FFFFFF;">Het AdCure Team</strong>
    </p>
  `)

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Accountaanvraag — ${data.companyName}`,
      html,
    })
  } catch (err) {
    console.error('[email] sendApplicationRejectedEmail failed:', err)
  }
}
