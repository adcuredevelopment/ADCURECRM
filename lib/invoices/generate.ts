import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '@/types/database.types'
import { createMoneybirdInvoice } from '@/lib/moneybird/client'
import { sendInvoiceEmail } from '@/lib/email/send'

const VAT_RATE = 0.21

/**
 * Generate the next sequential invoice number in format INV-YYYY-XXXXXX.
 * Queries the DB for the highest existing number and increments.
 */
export async function generateInvoiceNumber(
  supabase: SupabaseClient<Database>
): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  // Find the latest invoice number for the current year
  const { data: latestInvoices } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)

  let nextSequence = 1

  if (latestInvoices && latestInvoices.length > 0) {
    const latestNumber = latestInvoices[0].invoice_number
    // Extract the numeric suffix (last 6 digits)
    const sequencePart = latestNumber.replace(prefix, '')
    const parsed = parseInt(sequencePart, 10)
    if (!isNaN(parsed)) {
      nextSequence = parsed + 1
    }
  }

  // Zero-pad to 6 digits: 1 → "000001"
  const paddedSequence = String(nextSequence).padStart(6, '0')
  return `${prefix}${paddedSequence}`
}

/**
 * Generate an invoice for an approved top_up transaction.
 * Steps:
 *  1. Fetch transaction + wallet + user + organization
 *  2. Calculate VAT (21% of deposit amount)
 *  3. Create invoice record in DB
 *  4. Try Moneybird (graceful fail)
 *  5. Send invoice email (graceful fail)
 *  6. Update invoice status to 'sent' if email succeeded
 */
export async function generateInvoice(
  transactionId: string,
  supabase: SupabaseClient<Database>
): Promise<void> {
  try {
    // 1. Fetch transaction with wallet info
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (txError || !transaction) {
      console.error('[invoice] Failed to fetch transaction:', txError)
      return
    }

    // Fetch wallet → organization_id
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('organization_id')
      .eq('id', transaction.wallet_id)
      .single()

    if (walletError || !wallet) {
      console.error('[invoice] Failed to fetch wallet:', walletError)
      return
    }

    // Fetch user (the one who created the transaction)
    let userEmail = ''
    let userName = ''
    if (transaction.created_by) {
      const { data: user } = await supabase
        .from('users')
        .select('email, full_name, company_name')
        .eq('id', transaction.created_by)
        .single()

      if (user) {
        userEmail = user.email
        userName = user.company_name ?? user.full_name ?? user.email
      }
    }

    // Fetch organization name as fallback
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', wallet.organization_id)
      .single()

    const clientName = userName || org?.name || 'Klant'

    // 2. Calculate amounts
    const amountCents = transaction.amount_cents
    const vatCents = Math.round(amountCents * VAT_RATE)
    const totalCents = amountCents + vatCents

    // 3. Generate invoice number and create DB record
    const invoiceNumber = await generateInvoiceNumber(supabase)

    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        organization_id: wallet.organization_id,
        transaction_id: transactionId,
        invoice_number: invoiceNumber,
        amount_cents: amountCents,
        vat_cents: vatCents,
        total_cents: totalCents,
        status: 'created',
      })
      .select()
      .single()

    if (insertError || !invoice) {
      console.error('[invoice] Failed to insert invoice record:', insertError)
      return
    }

    let moneybirdId: string | null = null
    let invoiceStatus: 'created' | 'sent' = 'created'

    // 4. Try Moneybird (non-blocking)
    try {
      const moneybirdResult = await createMoneybirdInvoice({
        invoiceNumber,
        clientEmail: userEmail,
        clientName,
        amountCents,
        vatCents,
        description: `Wallet top-up — ${invoiceNumber}`,
      })

      if (moneybirdResult) {
        moneybirdId = moneybirdResult.id
      }
    } catch (err) {
      console.error('[invoice] Moneybird invoice creation failed (non-fatal):', err)
    }

    // 5. Try sending invoice email (non-blocking)
    if (userEmail) {
      try {
        await sendInvoiceEmail({
          to: userEmail,
          invoiceNumber,
          amountCents,
          totalCents,
        })
        invoiceStatus = 'sent'
      } catch (err) {
        console.error('[invoice] Invoice email failed (non-fatal):', err)
      }
    }

    // 6. Update invoice with Moneybird ID and status
    const updatePayload: {
      status: 'created' | 'sent'
      moneybird_id?: string
      sent_at?: string
    } = { status: invoiceStatus }

    if (moneybirdId) {
      updatePayload.moneybird_id = moneybirdId
    }

    if (invoiceStatus === 'sent') {
      updatePayload.sent_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('invoices')
      .update(updatePayload)
      .eq('id', invoice.id)

    if (updateError) {
      console.error('[invoice] Failed to update invoice status:', updateError)
    }
  } catch (err) {
    // Catch-all: invoice generation must never crash the parent flow
    console.error('[invoice] Unexpected error in generateInvoice:', err)
  }
}
