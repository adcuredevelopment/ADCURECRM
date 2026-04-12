import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface AdminAlert {
  id: string
  type: 'pending_account_request' | 'pending_deposit' | 'low_wallet'
  severity: 'critical' | 'warning'
  message: string
  count: number
  actionUrl: string
}

/**
 * GET /api/admin/alerts
 * Returns active alerts requiring admin attention:
 * - Pending account requests older than 24h
 * - Pending deposits older than 48h
 * - Wallets with balance < €10 (1000 cents)
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

    const now = new Date()
    const threshold24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const threshold48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()

    const alerts: AdminAlert[] = []

    // Pending account requests > 24h old
    const { count: oldRequests, error: reqError } = await supabase
      .from('ad_account_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('created_at', threshold24h)

    if (!reqError && (oldRequests ?? 0) > 0) {
      alerts.push({
        id: 'pending-account-requests',
        type: 'pending_account_request',
        severity: 'critical',
        message: `${oldRequests} pending account request${oldRequests! > 1 ? 's' : ''} awaiting review for over 24 hours`,
        count: oldRequests ?? 0,
        actionUrl: '/agency/ad-accounts',
      })
    }

    // Pending deposits > 48h old
    const { count: oldDeposits, error: depError } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'top_up')
      .eq('status', 'pending')
      .lte('created_at', threshold48h)

    if (!depError && (oldDeposits ?? 0) > 0) {
      alerts.push({
        id: 'pending-deposits',
        type: 'pending_deposit',
        severity: 'critical',
        message: `${oldDeposits} pending deposit${oldDeposits! > 1 ? 's' : ''} awaiting verification for over 48 hours`,
        count: oldDeposits ?? 0,
        actionUrl: '/agency/wallets',
      })
    }

    // Wallets with balance < 1000 cents (< €10)
    const { data: lowWallets, error: walletError } = await supabase
      .from('wallets')
      .select('id')
      .lt('balance_cents', 1000)

    if (!walletError && (lowWallets ?? []).length > 0) {
      const count = lowWallets!.length
      alerts.push({
        id: 'low-wallets',
        type: 'low_wallet',
        severity: 'warning',
        message: `${count} client wallet${count > 1 ? 's have' : ' has'} a balance below €10`,
        count,
        actionUrl: '/agency/wallets',
      })
    }

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('[GET /api/admin/alerts]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
