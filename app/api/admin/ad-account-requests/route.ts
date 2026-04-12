import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/ad-account-requests
 * Returns all ad account requests across all clients.
 * Query params: status (pending|approved|rejected|all)
 * Joins with users to include client email.
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
    const statusParam = searchParams.get('status') ?? 'all'

    let query = supabase
      .from('ad_account_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusParam === 'pending' || statusParam === 'approved' || statusParam === 'rejected') {
      query = query.eq('status', statusParam)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('[GET /api/admin/ad-account-requests] query error:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json([])
    }

    // Collect all unique organization IDs and fetch client emails
    const orgIds = [...new Set(requests.map((r) => r.organization_id))]

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

    const enriched = requests.map((r) => ({
      ...r,
      client_email: orgClientMap.get(r.organization_id)?.email ?? 'Unknown',
      client_name: orgClientMap.get(r.organization_id)?.fullName ?? null,
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('[GET /api/admin/ad-account-requests]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
