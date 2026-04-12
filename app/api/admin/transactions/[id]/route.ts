import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInvoice } from '@/lib/invoices/generate'
import { sendDepositApprovedEmail, sendDepositRejectedEmail } from '@/lib/email/send'

interface UpdateTransactionBody {
  status: 'completed' | 'rejected'
  notes?: string
}

/**
 * PATCH /api/admin/transactions/[id]
 * Approve or reject a pending top_up transaction.
 * If completed, increments the wallet balance by the transaction amount.
 * Stores reviewed_by and reviewed_at.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'agency_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body: UpdateTransactionBody = await request.json()

    if (!body.status || !['completed', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: 'status must be "completed" or "rejected"' },
        { status: 400 }
      )
    }

    // Fetch the transaction to validate it exists and is pending
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending transactions can be reviewed' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Update the transaction status
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({
        status: body.status,
        reviewed_by: user.id,
        reviewed_at: now,
        notes: body.notes ?? null,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updatedTransaction) {
      console.error('[PATCH /api/admin/transactions/[id]] update error:', updateError)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

    // If completed, increment the wallet balance
    if (body.status === 'completed') {
      // Fetch current wallet balance
      const { data: wallet, error: walletFetchError } = await supabase
        .from('wallets')
        .select('balance_cents')
        .eq('id', transaction.wallet_id)
        .single()

      if (walletFetchError || !wallet) {
        console.error('[PATCH /api/admin/transactions/[id]] wallet fetch error:', walletFetchError)
        return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
      }

      const newBalance = wallet.balance_cents + transaction.amount_cents

      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({
          balance_cents: newBalance,
          updated_at: now,
        })
        .eq('id', transaction.wallet_id)

      if (walletUpdateError) {
        console.error('[PATCH /api/admin/transactions/[id]] wallet update error:', walletUpdateError)
        return NextResponse.json({ error: 'Failed to update wallet balance' }, { status: 500 })
      }

      // Generate invoice and send approval email (graceful — must not block response)
      try {
        await generateInvoice(id, supabase)
      } catch (err) {
        console.error('[PATCH /api/admin/transactions/[id]] invoice generation failed (non-fatal):', err)
      }

      // Fetch user email for approval notification
      try {
        if (transaction.created_by) {
          const { data: txUser } = await supabase
            .from('users')
            .select('email')
            .eq('id', transaction.created_by)
            .single()

          if (txUser?.email) {
            await sendDepositApprovedEmail({
              to: txUser.email,
              amountCents: transaction.amount_cents,
              newBalanceCents: newBalance,
            })
          }
        }
      } catch (err) {
        console.error('[PATCH /api/admin/transactions/[id]] approval email failed (non-fatal):', err)
      }
    }

    // Send rejection email (graceful — must not block response)
    if (body.status === 'rejected') {
      try {
        if (transaction.created_by) {
          const { data: txUser } = await supabase
            .from('users')
            .select('email')
            .eq('id', transaction.created_by)
            .single()

          if (txUser?.email) {
            await sendDepositRejectedEmail({
              to: txUser.email,
              amountCents: transaction.amount_cents,
              reason: body.notes ?? 'Geen reden opgegeven.',
            })
          }
        }
      } catch (err) {
        console.error('[PATCH /api/admin/transactions/[id]] rejection email failed (non-fatal):', err)
      }
    }

    return NextResponse.json(updatedTransaction)
  } catch (error) {
    console.error('[PATCH /api/admin/transactions/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
