import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/revenue
 * Returns revenue per day for the last 7 days.
 * Queries completed top_up transactions and groups by day.
 * Missing days are filled with 0.
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
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'agency_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build date range for last 7 days
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount_cents, created_at')
      .eq('type', 'top_up')
      .eq('status', 'completed')
      .gte('created_at', sevenDaysAgo.toISOString())
      .lte('created_at', today.toISOString())

    if (error) {
      console.error('[GET /api/admin/revenue] query error:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    // Group transactions by date (YYYY-MM-DD)
    const revenueMap = new Map<string, number>()
    for (const tx of transactions ?? []) {
      const dateKey = tx.created_at.slice(0, 10)
      revenueMap.set(dateKey, (revenueMap.get(dateKey) ?? 0) + tx.amount_cents)
    }

    // Build result array for all 7 days, filling missing with 0
    const result: { date: string; revenue: number }[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo)
      date.setDate(sevenDaysAgo.getDate() + i)
      const dateKey = date.toISOString().slice(0, 10)
      result.push({
        date: dateKey,
        revenue: revenueMap.get(dateKey) ?? 0,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/admin/revenue]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
