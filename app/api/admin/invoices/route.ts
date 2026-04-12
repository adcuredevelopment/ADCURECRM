import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/invoices
 * Returns all invoices across all clients (admin only).
 * Query params: status (created|sent|paid), search (invoice_number)
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
    const statusFilter = searchParams.get('status')
    const searchFilter = searchParams.get('search')

    let query = supabase
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
        organizations (
          id,
          name
        ),
        transactions (
          id,
          type,
          reference,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    // Apply optional status filter
    if (statusFilter && ['created', 'sent', 'paid'].includes(statusFilter)) {
      query = query.eq('status', statusFilter as 'created' | 'sent' | 'paid')
    }

    // Apply optional invoice number search filter
    if (searchFilter) {
      query = query.ilike('invoice_number', `%${searchFilter}%`)
    }

    const { data: invoices, error: invoicesError } = await query

    if (invoicesError) {
      console.error('[GET /api/admin/invoices] query error:', invoicesError)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    return NextResponse.json(invoices ?? [])
  } catch (error) {
    console.error('[GET /api/admin/invoices]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
