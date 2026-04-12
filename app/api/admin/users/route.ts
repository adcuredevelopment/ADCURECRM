import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/users
 * Returns all users with organization info.
 * Query params: search (string), role (client|agency_admin|all)
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
    const search = searchParams.get('search') ?? ''
    const roleParam = searchParams.get('role') ?? 'all'

    let query = supabase
      .from('users')
      .select('id, email, full_name, phone, company_name, role, organization_id, created_at')
      .order('created_at', { ascending: false })

    if (roleParam === 'client' || roleParam === 'agency_admin') {
      query = query.eq('role', roleParam)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('[GET /api/admin/users] query error:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    let filteredUsers = users ?? []

    // Apply search filter (case-insensitive on name and email)
    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(searchLower) ||
          (u.full_name && u.full_name.toLowerCase().includes(searchLower)) ||
          (u.company_name && u.company_name.toLowerCase().includes(searchLower))
      )
    }

    // Fetch organization names
    const orgIds = [...new Set(filteredUsers.map((u) => u.organization_id))]

    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name, type')
      .in('id', orgIds)

    const orgMap = new Map<string, { name: string; type: string }>()
    for (const org of orgsData ?? []) {
      orgMap.set(org.id, { name: org.name, type: org.type })
    }

    const enriched = filteredUsers.map((u) => ({
      ...u,
      organization_name: orgMap.get(u.organization_id)?.name ?? null,
      organization_type: orgMap.get(u.organization_id)?.type ?? null,
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('[GET /api/admin/users]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users
 * Creates a new user record in public.users.
 * Note: Auth is managed separately via Supabase dashboard.
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { email, full_name, role, organization_id } = body

    if (!email || !role || !organization_id) {
      return NextResponse.json(
        { error: 'email, role, and organization_id are required' },
        { status: 400 }
      )
    }

    if (!['client', 'agency_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be "client" or "agency_admin"' },
        { status: 400 }
      )
    }

    // Generate a temporary ID (in practice, Supabase Auth creates the real UUID)
    const tempId = crypto.randomUUID()

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: tempId,
        email,
        full_name: full_name ?? null,
        role,
        organization_id,
      })
      .select()
      .single()

    if (insertError || !newUser) {
      console.error('[POST /api/admin/users] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/users]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
