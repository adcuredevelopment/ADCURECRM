import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendApplicationRejectedEmail } from '@/lib/email/send'

/**
 * POST /api/admin/account-applications/[id]/reject
 * Rejects an application with a required reason.
 * Sends rejection email to applicant.
 */
export async function POST(
  request: NextRequest,
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
    const body = await request.json()
    const { rejection_reason } = body

    if (!rejection_reason?.trim()) {
      return NextResponse.json(
        { error: 'Afwijzingsreden is verplicht' },
        { status: 400 }
      )
    }

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

    // Update status
    await adminClient
      .from('account_applications')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejection_reason.trim(),
      })
      .eq('id', id)

    // Send rejection email (non-blocking)
    await sendApplicationRejectedEmail({
      to: app.email,
      fullName: app.full_name,
      companyName: app.company_name,
      rejectionReason: rejection_reason.trim(),
    }).catch((err) =>
      console.error('[reject] rejection email failed (non-fatal):', err)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/admin/account-applications/[id]/reject]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
