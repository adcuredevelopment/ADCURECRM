import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAccountApprovedEmail, sendAccountRejectedEmail } from '@/lib/email/send'

interface UpdateRequestBody {
  status: 'approved' | 'rejected'
  rejection_reason?: string
}

/**
 * PATCH /api/admin/ad-account-requests/[id]
 * Approve or reject an ad account request.
 * If approved, also creates a new ad_account record with default values.
 * Stores reviewed_by and reviewed_at.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body: UpdateRequestBody = await request.json()

    if (!body.status || !['approved', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: 'status must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    if (body.status === 'rejected' && !body.rejection_reason) {
      return NextResponse.json(
        { error: 'rejection_reason is required when rejecting' },
        { status: 400 }
      )
    }

    // Fetch the request to validate it exists
    const { data: existingRequest, error: fetchError } = await supabase
      .from('ad_account_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const now = new Date().toISOString()

    // Update the request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('ad_account_requests')
      .update({
        status: body.status,
        reviewed_by: user.id,
        reviewed_at: now,
        rejection_reason: body.rejection_reason ?? null,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updatedRequest) {
      console.error('[PATCH /api/admin/ad-account-requests/[id]] update error:', updateError)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    // If approved, create a corresponding ad_account record
    if (body.status === 'approved') {
      // Read default fee from env, fallback to 5%
      const defaultFee = parseFloat(process.env.DEFAULT_FEE_PERCENTAGE ?? '5')

      const { error: insertError } = await supabase
        .from('ad_accounts')
        .insert({
          organization_id: existingRequest.organization_id,
          name: existingRequest.account_name,
          account_id: `pending-${id}`,
          platform: existingRequest.platform,
          currency: existingRequest.currency,
          timezone: existingRequest.timezone,
          fee_percentage: defaultFee,
          status: 'active',
          balance_cents: 0,
        })

      if (insertError) {
        // Non-fatal: log but don't fail the request update
        console.error('[PATCH /api/admin/ad-account-requests/[id]] ad_account insert error:', insertError)
      }

      // Send approval email (graceful — must not block response)
      try {
        // Fetch requesting user's email via organization
        const { data: requestingUser } = await supabase
          .from('users')
          .select('email')
          .eq('organization_id', existingRequest.organization_id)
          .eq('role', 'client')
          .limit(1)
          .single()

        if (requestingUser?.email) {
          await sendAccountApprovedEmail({
            to: requestingUser.email,
            accountName: existingRequest.account_name,
            platform: existingRequest.platform,
          })
        }
      } catch (err) {
        console.error('[PATCH /api/admin/ad-account-requests/[id]] approval email failed (non-fatal):', err)
      }
    }

    // Send rejection email (graceful — must not block response)
    if (body.status === 'rejected') {
      try {
        const { data: requestingUser } = await supabase
          .from('users')
          .select('email')
          .eq('organization_id', existingRequest.organization_id)
          .eq('role', 'client')
          .limit(1)
          .single()

        if (requestingUser?.email) {
          await sendAccountRejectedEmail({
            to: requestingUser.email,
            accountName: existingRequest.account_name,
            rejectionReason: body.rejection_reason ?? 'Geen reden opgegeven.',
          })
        }
      } catch (err) {
        console.error('[PATCH /api/admin/ad-account-requests/[id]] rejection email failed (non-fatal):', err)
      }
    }

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('[PATCH /api/admin/ad-account-requests/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
