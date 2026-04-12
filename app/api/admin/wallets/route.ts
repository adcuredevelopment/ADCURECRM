import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/wallets
 * Returns all client wallets with enriched client info and stats.
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

    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
    }

    if (!wallets || wallets.length === 0) {
      return NextResponse.json([])
    }

    // Fetch organization names and associated user info
    const orgIds = [...new Set(wallets.map((w) => w.organization_id))]

    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name')
      .in('id', orgIds)

    const { data: usersData } = await supabase
      .from('users')
      .select('organization_id, email, full_name')
      .in('organization_id', orgIds)
      .eq('role', 'client')

    const orgNameMap = new Map<string, string>()
    for (const org of orgsData ?? []) {
      orgNameMap.set(org.id, org.name)
    }

    const orgClientMap = new Map<string, { email: string; fullName: string | null }>()
    for (const u of usersData ?? []) {
      if (!orgClientMap.has(u.organization_id)) {
        orgClientMap.set(u.organization_id, {
          email: u.email,
          fullName: u.full_name,
        })
      }
    }

    // Fetch transaction stats per wallet
    const walletIds = wallets.map((w) => w.id)

    const { data: transactions } = await supabase
      .from('transactions')
      .select('wallet_id, type, status, amount_cents')
      .in('wallet_id', walletIds)

    const txMap = new Map<string, { deposited: number; pending: number }>()
    for (const tx of transactions ?? []) {
      const current = txMap.get(tx.wallet_id) ?? { deposited: 0, pending: 0 }
      if (tx.status === 'completed' && tx.type === 'top_up') {
        current.deposited += tx.amount_cents
      } else if (tx.status === 'pending') {
        current.pending += tx.amount_cents
      }
      txMap.set(tx.wallet_id, current)
    }

    const enriched = wallets.map((w) => {
      const stats = txMap.get(w.id) ?? { deposited: 0, pending: 0 }
      return {
        ...w,
        organization_name: orgNameMap.get(w.organization_id) ?? 'Unknown',
        client_email: orgClientMap.get(w.organization_id)?.email ?? 'Unknown',
        client_name: orgClientMap.get(w.organization_id)?.fullName ?? null,
        total_deposited_cents: stats.deposited,
        pending_cents: stats.pending,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('[GET /api/admin/wallets]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
