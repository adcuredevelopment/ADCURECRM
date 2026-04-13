import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendApplicationApprovedEmail } from '@/lib/email/send'

/**
 * POST /api/admin/account-applications/[id]/approve
 * Approves an application and creates:
 * 1. Organization
 * 2. Auth user (via admin client)
 * 3. Public users record
 * 4. Wallet
 * Full rollback on any failure.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'agency_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Fetch application
    const { data: app, error: appError } = await adminClient
      .from('account_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (appError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (app.status !== 'pending') {
      return NextResponse.json(
        { error: `Application is already ${app.status}` },
        { status: 400 }
      )
    }

    // =====================================================
    // Step 1: Create organization
    // =====================================================
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({ name: app.company_name, type: 'client' })
      .select()
      .single()

    if (orgError || !org) {
      console.error('[approve] org creation failed:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // =====================================================
    // Step 2: Create Supabase Auth user
    // =====================================================
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: app.email,
      email_confirm: true,
      user_metadata: {
        full_name: app.full_name,
        company_name: app.company_name,
        kvk_number: app.kvk_number,
        vat_number: app.vat_number,
      },
    })

    if (authError || !authData.user) {
      console.error('[approve] auth user creation failed:', authError)
      // Rollback org
      await adminClient.from('organizations').delete().eq('id', org.id)
      return NextResponse.json(
        { error: authError?.message ?? 'Failed to create auth user' },
        { status: 500 }
      )
    }

    // =====================================================
    // Step 3: Create public.users record
    // =====================================================
    const { error: userError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        organization_id: org.id,
        email: app.email,
        full_name: app.full_name,
        phone: app.phone,
        company_name: app.company_name,
        role: 'client',
      })

    if (userError) {
      console.error('[approve] users insert failed:', userError)
      // Rollback auth + org
      await adminClient.auth.admin.deleteUser(authData.user.id)
      await adminClient.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 })
    }

    // =====================================================
    // Step 4: Create wallet
    // =====================================================
    const { error: walletError } = await adminClient
      .from('wallets')
      .insert({ organization_id: org.id, balance_cents: 0, currency: 'EUR' })

    if (walletError) {
      console.error('[approve] wallet creation failed:', walletError)
      // Rollback all
      await adminClient.from('users').delete().eq('id', authData.user.id)
      await adminClient.auth.admin.deleteUser(authData.user.id)
      await adminClient.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: 'Failed to create wallet' }, { status: 500 })
    }

    // =====================================================
    // Step 5: Update application status
    // =====================================================
    await adminClient
      .from('account_applications')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    // =====================================================
    // Step 6: Send password reset + welcome email (non-blocking)
    // =====================================================
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`

    await Promise.allSettled([
      adminClient.auth.resetPasswordForEmail(app.email, {
        redirectTo: loginUrl,
      }),
      sendApplicationApprovedEmail({
        to: app.email,
        fullName: app.full_name,
        companyName: app.company_name,
        loginUrl,
      }),
    ])

    return NextResponse.json({
      success: true,
      organization_id: org.id,
      user_id: authData.user.id,
    })
  } catch (error) {
    console.error('[POST /api/admin/account-applications/[id]/approve]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
