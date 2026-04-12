import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateFee } from '@/lib/utils/fees'
import { eurosToCents, centsToEuros } from '@/lib/utils/currency'

interface TopUpBody {
  amount_cents: number
  payment_method: 'wallet' | 'bank_transfer'
  proof_url?: string
  notes?: string
}

/**
 * POST /api/ad-accounts/[id]/top-up
 * Initiates a top-up for a specific ad account.
 * - wallet: deducts from wallet balance immediately (transfer)
 * - bank_transfer: creates a pending transaction for manual review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: accountId } = await params
    const body: TopUpBody = await request.json()

    if (!body.amount_cents || body.amount_cents <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Verify the ad account belongs to this organization
    const { data: account } = await supabase
      .from('ad_accounts')
      .select('id, fee_percentage, organization_id')
      .eq('id', accountId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Ad account not found' }, { status: 404 })
    }

    // Calculate fee breakdown based on ad amount (in euros)
    const adAmountEuros = centsToEuros(body.amount_cents)
    const feeBreakdown = calculateFee(adAmountEuros, account.fee_percentage)
    const totalCents = eurosToCents(feeBreakdown.total)

    // Get wallet for this organization
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance_cents')
      .eq('organization_id', profile.organization_id)
      .single()

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    if (body.payment_method === 'wallet') {
      // Check if wallet has sufficient balance (total including fee + VAT)
      if (wallet.balance_cents < totalCents) {
        return NextResponse.json(
          { error: 'Insufficient wallet balance' },
          { status: 400 }
        )
      }

      // Create completed transfer transaction (wallet deduction)
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'transfer',
          amount_cents: totalCents,
          status: 'completed',
          ad_account_id: accountId,
          notes: body.notes ?? null,
          created_by: user.id,
        })
        .select('id, status')
        .single()

      if (error || !transaction) {
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
      }

      // Deduct from wallet balance
      await supabase
        .from('wallets')
        .update({ balance_cents: wallet.balance_cents - totalCents })
        .eq('id', wallet.id)

      return NextResponse.json({
        transaction_id: transaction.id,
        fee_breakdown: feeBreakdown,
      })
    } else {
      // bank_transfer: create pending transaction
      if (!body.proof_url) {
        return NextResponse.json(
          { error: 'Proof of payment required for bank transfer' },
          { status: 400 }
        )
      }

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'transfer',
          amount_cents: totalCents,
          status: 'pending',
          ad_account_id: accountId,
          proof_url: body.proof_url,
          notes: body.notes ?? null,
          created_by: user.id,
        })
        .select('id, status')
        .single()

      if (error || !transaction) {
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
      }

      return NextResponse.json({
        transaction_id: transaction.id,
        fee_breakdown: feeBreakdown,
      })
    }
  } catch (error) {
    console.error('[POST /api/ad-accounts/[id]/top-up]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
