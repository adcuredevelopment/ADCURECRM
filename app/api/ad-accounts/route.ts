import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/ad-accounts
 * Returns all ad accounts for the authenticated user's organization.
 */
export async function GET() {
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

    const { data: accounts, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch ad accounts' }, { status: 500 })
    }

    return NextResponse.json(accounts ?? [])
  } catch (error) {
    console.error('[GET /api/ad-accounts]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
