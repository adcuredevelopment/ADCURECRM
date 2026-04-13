import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'agency_admin') return null
  return user
}

/**
 * GET /api/admin/clients/[id]
 * Returns full client profile with stats, wallet, and ad accounts
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const adminUser = await checkAdmin(supabase)
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const adminClient = createAdminClient()

    // Fetch user + organization
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('*, organizations(id, name, type)')
      .eq('id', id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch wallet
    const { data: wallet } = await adminClient
      .from('wallets')
      .select('*')
      .eq('organization_id', user.organization_id)
      .single()

    // Fetch ad accounts
    const { data: adAccounts } = await adminClient
      .from('ad_accounts')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false })

    // Fetch transaction stats
    const { data: transactions } = await adminClient
      .from('transactions')
      .select('amount_cents, status, type, created_at')
      .eq('wallet_id', wallet?.id ?? '')

    const totalTopUps = transactions
      ?.filter((t) => t.type === 'top_up' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount_cents, 0) ?? 0

    const totalSpent = transactions
      ?.filter((t) => t.type === 'transfer' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount_cents, 0) ?? 0

    return NextResponse.json({
      user,
      wallet,
      adAccounts: adAccounts ?? [],
      stats: {
        activeAdAccounts: adAccounts?.filter((a) => a.status === 'active').length ?? 0,
        totalAdAccounts: adAccounts?.length ?? 0,
        walletBalance: wallet?.balance_cents ?? 0,
        totalTopUps,
        totalSpent,
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/clients/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/clients/[id]
 * Updates editable fields: full_name, phone, email only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const adminUser = await checkAdmin(supabase)
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const adminClient = createAdminClient()

    // Only allow editing these fields
    const updateData: {
      updated_at: string
      full_name?: string | null
      phone?: string | null
      email?: string
    } = { updated_at: new Date().toISOString() }

    if ('full_name' in body) updateData.full_name = body.full_name ?? null
    if ('phone' in body) updateData.phone = body.phone ?? null
    if ('email' in body && body.email) updateData.email = body.email

    const { data, error } = await adminClient
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[PATCH /api/admin/clients/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/clients/[id]
 * Deletes client + organization + wallet + ad accounts + auth user
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const adminUser = await checkAdmin(supabase)
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const adminClient = createAdminClient()

    // Get user to find org
    const { data: user } = await adminClient
      .from('users')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (!user) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const orgId = user.organization_id

    // Delete in order (FK constraints)
    // 1. Transactions (via wallet)
    const { data: wallet } = await adminClient
      .from('wallets')
      .select('id')
      .eq('organization_id', orgId)
      .single()

    if (wallet) {
      await adminClient.from('transactions').delete().eq('wallet_id', wallet.id)
      await adminClient.from('wallets').delete().eq('id', wallet.id)
    }

    // 2. Ad accounts + requests
    await adminClient.from('ad_accounts').delete().eq('organization_id', orgId)
    await adminClient.from('ad_account_requests').delete().eq('organization_id', orgId)

    // 3. Invoices
    await adminClient.from('invoices').delete().eq('organization_id', orgId)

    // 4. User record
    await adminClient.from('users').delete().eq('id', id)

    // 5. Auth user
    await adminClient.auth.admin.deleteUser(id)

    // 6. Organization
    await adminClient.from('organizations').delete().eq('id', orgId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/clients/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
