import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CreateRequestBody {
  account_name: string
  domain_name: string
  business_manager_id: string
  currency: string
  timezone: string
  platform: 'meta' | 'google' | 'tiktok'
}

/**
 * GET /api/ad-account-requests
 * Returns all ad account requests for the authenticated user's organization.
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
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { data: requests, error } = await supabase
      .from('ad_account_requests')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json(requests ?? [])
  } catch (error) {
    console.error('[GET /api/ad-account-requests]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/ad-account-requests
 * Creates a new ad account request for the authenticated user's organization.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateRequestBody = await request.json()

    // Validate required fields
    if (!body.account_name || !body.domain_name || !body.business_manager_id) {
      return NextResponse.json(
        { error: 'account_name, domain_name, and business_manager_id are required' },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { data: adRequest, error } = await supabase
      .from('ad_account_requests')
      .insert({
        organization_id: profile.organization_id,
        account_name: body.account_name,
        domain_name: body.domain_name,
        business_manager_id: body.business_manager_id,
        currency: body.currency ?? 'EUR',
        timezone: body.timezone ?? 'Europe/Amsterdam',
        platform: body.platform ?? 'meta',
        status: 'pending',
      })
      .select('id, status')
      .single()

    if (error || !adRequest) {
      console.error('[POST /api/ad-account-requests] Insert error:', error)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    return NextResponse.json(adRequest, { status: 201 })
  } catch (error) {
    console.error('[POST /api/ad-account-requests]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
