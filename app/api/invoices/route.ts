import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/invoices
 * Returns all invoices for the authenticated client's organization.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's organization
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Fetch all invoices for this organization, joined with transaction info
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        organization_id,
        transaction_id,
        invoice_number,
        moneybird_id,
        amount_cents,
        vat_cents,
        total_cents,
        status,
        pdf_url,
        sent_at,
        created_at,
        updated_at,
        transactions (
          id,
          type,
          reference,
          created_at
        )
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (invoicesError) {
      console.error('[GET /api/invoices] query error:', invoicesError)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    return NextResponse.json(invoices ?? [])
  } catch (error) {
    console.error('[GET /api/invoices]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
