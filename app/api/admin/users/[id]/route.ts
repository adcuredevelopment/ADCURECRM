import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type UserUpdate = Database['public']['Tables']['users']['Update']

/**
 * PATCH /api/admin/users/[id]
 * Updates a user's profile fields.
 * Allowed fields: full_name, phone, company_name, role
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
    const body = await request.json()

    if (body.role && !['client', 'agency_admin'].includes(body.role as string)) {
      return NextResponse.json(
        { error: 'role must be "client" or "agency_admin"' },
        { status: 400 }
      )
    }

    const updateData: UserUpdate = {
      updated_at: new Date().toISOString(),
    }

    if ('full_name' in body) updateData.full_name = body.full_name ?? null
    if ('phone' in body) updateData.phone = body.phone ?? null
    if ('company_name' in body) updateData.company_name = body.company_name ?? null
    if ('role' in body) updateData.role = body.role as 'client' | 'agency_admin'

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updatedUser) {
      console.error('[PATCH /api/admin/users/[id]] update error:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('[PATCH /api/admin/users/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Removes a user from public.users.
 * Note: Does not delete auth user — that must be done via Supabase dashboard.
 */
export async function DELETE(
  _request: NextRequest,
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

    // Prevent deleting yourself
    if (id === user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('[DELETE /api/admin/users/[id]] delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/users/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
