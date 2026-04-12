import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/stats
 * Returns aggregate statistics for the agency admin dashboard.
 * Requires agency_admin role.
 */
export async function GET() {
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

    // COUNT orgs WHERE type='client'
    const { count: totalClients, error: orgsError } = await supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'client')

    if (orgsError) {
      console.error('[GET /api/admin/stats] orgsError:', orgsError)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    // SUM ad_accounts.balance_cents
    const { data: adAccounts, error: adError } = await supabase
      .from('ad_accounts')
      .select('balance_cents')

    if (adError) {
      return NextResponse.json({ error: 'Failed to fetch ad accounts' }, { status: 500 })
    }

    const totalAdBalance = (adAccounts ?? []).reduce(
      (sum, a) => sum + (a.balance_cents ?? 0),
      0
    )

    // SUM wallets.balance_cents
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('balance_cents')

    if (walletsError) {
      return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
    }

    const totalWalletBalance = (wallets ?? []).reduce(
      (sum, w) => sum + (w.balance_cents ?? 0),
      0
    )

    // COUNT ad_account_requests WHERE status='pending'
    const { count: pendingRequests, error: reqError } = await supabase
      .from('ad_account_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (reqError) {
      return NextResponse.json({ error: 'Failed to fetch pending requests' }, { status: 500 })
    }

    // COUNT transactions WHERE type='top_up' AND status='pending'
    const { count: pendingDeposits, error: depError } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'top_up')
      .eq('status', 'pending')

    if (depError) {
      return NextResponse.json({ error: 'Failed to fetch pending deposits' }, { status: 500 })
    }

    return NextResponse.json({
      totalClients: totalClients ?? 0,
      totalAdBalance,
      totalWalletBalance,
      pendingRequests: pendingRequests ?? 0,
      pendingDeposits: pendingDeposits ?? 0,
    })
  } catch (error) {
    console.error('[GET /api/admin/stats]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
