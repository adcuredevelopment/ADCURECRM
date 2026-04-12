import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/wallet
 * Returns the wallet balance and computed stats for the authenticated user's organization.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the user's organization_id
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Fetch wallet for this organization
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance_cents, currency, organization_id')
      .eq('organization_id', profile.organization_id)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    // Fetch all transactions to compute stats
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('type, status, amount_cents')
      .eq('wallet_id', wallet.id)

    if (txError) {
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    const txList = transactions ?? []

    // Sum pending transactions (any type that is pending)
    const pendingCents = txList
      .filter((tx) => tx.status === 'pending')
      .reduce((sum, tx) => sum + tx.amount_cents, 0)

    // Sum completed top_up transactions (deposits received)
    const depositedCents = txList
      .filter((tx) => tx.status === 'completed' && tx.type === 'top_up')
      .reduce((sum, tx) => sum + tx.amount_cents, 0)

    // Sum completed transfer transactions (spent on ad accounts)
    const spentCents = txList
      .filter((tx) => tx.status === 'completed' && tx.type === 'transfer')
      .reduce((sum, tx) => sum + tx.amount_cents, 0)

    return NextResponse.json({
      id: wallet.id,
      organization_id: wallet.organization_id,
      balance_cents: wallet.balance_cents,
      pending_cents: pendingCents,
      deposited_cents: depositedCents,
      spent_cents: spentCents,
      currency: wallet.currency,
    })
  } catch (error) {
    console.error('[GET /api/wallet]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
