/**
 * Moneybird API client for invoice creation.
 * Gracefully degrades when MONEYBIRD_API_KEY is not configured.
 */

const MONEYBIRD_BASE_URL = 'https://moneybird.com/api/v2'

export interface MoneybirdInvoiceResult {
  id: string
  invoiceNumber: string
  pdfUrl: string | null
}

/**
 * Checks whether Moneybird is properly configured with real credentials.
 * Placeholder values (used in development) will return false.
 */
function isMoneybirdConfigured(): boolean {
  const key = process.env.MONEYBIRD_API_KEY
  return !!key && !key.startsWith('placeholder_')
}

/**
 * Create a sales invoice in Moneybird.
 * Returns null if Moneybird is not configured — caller should handle gracefully.
 */
export async function createMoneybirdInvoice(data: {
  invoiceNumber: string
  clientEmail: string
  clientName: string
  amountCents: number
  vatCents: number
  description: string
}): Promise<MoneybirdInvoiceResult | null> {
  if (!isMoneybirdConfigured()) {
    console.warn('[moneybird] Not configured — skipping invoice creation for', data.invoiceNumber)
    return null
  }

  const administrationId = process.env.MONEYBIRD_ADMINISTRATION_ID
  const apiKey = process.env.MONEYBIRD_API_KEY

  if (!administrationId || administrationId.startsWith('placeholder_')) {
    console.warn('[moneybird] Administration ID not configured — skipping invoice creation')
    return null
  }

  // Convert cents to decimal euro string (Moneybird expects decimal prices)
  const amountEuros = (data.amountCents / 100).toFixed(2)

  const url = `${MONEYBIRD_BASE_URL}/${administrationId}/sales_invoices`

  const invoiceDate = new Date().toISOString().split('T')[0]

  const requestBody = {
    sales_invoice: {
      invoice_date: invoiceDate,
      reference: data.invoiceNumber,
      details_attributes: [
        {
          description: data.description,
          price: amountEuros,
          amount: '1',
        },
      ],
    },
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[moneybird] Invoice creation failed:', response.status, errorText)
      return null
    }

    const result = await response.json() as {
      id: string
      invoice_id: string
      details: unknown[]
    }

    return {
      id: result.id,
      invoiceNumber: data.invoiceNumber,
      // PDF URL pattern for Moneybird — actual PDF retrieval requires a separate API call
      pdfUrl: null,
    }
  } catch (err) {
    // Network errors or unexpected failures must not block the transaction flow
    console.error('[moneybird] Unexpected error during invoice creation:', err)
    return null
  }
}
