import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface DepositBody {
  amount_cents: number
  reference?: string
  proof_url?: string
}

/**
 * POST /api/wallet/deposit
 * Creates a pending top_up transaction for manual bank transfer review.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: DepositBody = await request.json()

    if (!body.amount_cents || body.amount_cents < 1000) {
      return NextResponse.json(
        { error: 'Minimum deposit amount is €10' },
        { status: 400 }
      )
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

    // Get wallet for this organization
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .single()

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    // Create pending top_up transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'top_up',
        amount_cents: body.amount_cents,
        status: 'pending',
        reference: body.reference ?? null,
        proof_url: body.proof_url ?? null,
        created_by: user.id,
      })
      .select('id, status')
      .single()

    if (error || !transaction) {
      console.error('[POST /api/wallet/deposit] Insert error:', error)
      return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 })
    }

    return NextResponse.json({
      transaction_id: transaction.id,
      status: transaction.status,
    })
  } catch (error) {
    console.error('[POST /api/wallet/deposit]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
