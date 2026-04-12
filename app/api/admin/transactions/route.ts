import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/transactions
 * Returns all pending top_up transactions across all clients.
 * Joins wallet → organization → user to include client info.
 * Query params: limit (number, optional)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 100

    // Fetch all pending top_up transactions
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('type', 'top_up')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (limit > 0) {
      query = query.limit(limit)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('[GET /api/admin/transactions] query error:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json([])
    }

    // Collect all wallet IDs to look up organization data
    const walletIds = [...new Set(transactions.map((t) => t.wallet_id))]

    const { data: walletsData } = await supabase
      .from('wallets')
      .select('id, organization_id')
      .in('id', walletIds)

    const walletOrgMap = new Map<string, string>()
    for (const w of walletsData ?? []) {
      walletOrgMap.set(w.id, w.organization_id)
    }

    const orgIds = [...new Set([...walletOrgMap.values()])]

    const { data: usersData } = await supabase
      .from('users')
      .select('organization_id, email, full_name')
      .in('organization_id', orgIds)
      .eq('role', 'client')

    // Build org → client info map (use first client user per org)
    const orgClientMap = new Map<string, { email: string; fullName: string | null }>()
    for (const u of usersData ?? []) {
      if (!orgClientMap.has(u.organization_id)) {
        orgClientMap.set(u.organization_id, {
          email: u.email,
          fullName: u.full_name,
        })
      }
    }

    const enriched = transactions.map((tx) => {
      const orgId = walletOrgMap.get(tx.wallet_id) ?? ''
      const client = orgClientMap.get(orgId)
      return {
        ...tx,
        client_email: client?.email ?? 'Unknown',
        client_name: client?.fullName ?? null,
        organization_id: orgId,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('[GET /api/admin/transactions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
