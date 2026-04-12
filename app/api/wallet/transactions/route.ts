import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/wallet/transactions
 * Query params: type, status, from (ISO date), to (ISO date), sort (newest|oldest|highest)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const searchParams = request.nextUrl.searchParams
    const typeFilter = searchParams.get('type')
    const statusFilter = searchParams.get('status')
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    const sort = searchParams.get('sort') ?? 'newest'

    // Build query with type-safe column values
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)

    if (typeFilter && typeFilter !== 'all') {
      query = query.eq('type', typeFilter as 'top_up' | 'transfer' | 'refund' | 'adjustment')
    }
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter as 'pending' | 'completed' | 'rejected')
    }
    if (fromDate) {
      query = query.gte('created_at', fromDate)
    }
    if (toDate) {
      // Include the full to-date by appending end of day
      query = query.lte('created_at', `${toDate}T23:59:59.999Z`)
    }

    // Apply sorting
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else if (sort === 'highest') {
      query = query.order('amount_cents', { ascending: false })
    } else {
      // newest (default)
      query = query.order('created_at', { ascending: false })
    }

    const { data: transactions, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    return NextResponse.json(transactions ?? [])
  } catch (error) {
    console.error('[GET /api/wallet/transactions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
