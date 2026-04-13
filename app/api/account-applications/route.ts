import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendApplicationReceivedEmail,
  sendAdminNewApplicationEmail,
} from '@/lib/email/send'

/**
 * POST /api/account-applications
 * Public endpoint — no auth required.
 * Submits a new account application for admin review.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company_name, kvk_number, vat_number, iban, full_name, email, phone } = body

    // Required field check
    if (!company_name || !kvk_number || !vat_number || !full_name || !email || !phone) {
      return NextResponse.json(
        { error: 'Alle verplichte velden moeten ingevuld zijn' },
        { status: 400 }
      )
    }

    // Format validations (server-side, same as API validate routes)
    if (!/^\d{8}$/.test(kvk_number.trim())) {
      return NextResponse.json(
        { error: 'KVK nummer moet exact 8 cijfers zijn' },
        { status: 400 }
      )
    }

    if (!/^NL\d{9}B\d{2}$/.test(vat_number.trim().toUpperCase())) {
      return NextResponse.json(
        { error: 'BTW nummer moet het format NL123456789B01 hebben' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS — this is a public endpoint, no auth session available
    const supabase = createAdminClient()

    const { data: application, error } = await supabase
      .from('account_applications')
      .insert({
        company_name: company_name.trim(),
        kvk_number: kvk_number.trim(),
        vat_number: vat_number.trim().toUpperCase(),
        iban: iban?.trim().toUpperCase() || null,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Dit emailadres heeft al een aanvraag ingediend' },
          { status: 400 }
        )
      }
      console.error('[POST /api/account-applications] insert error:', error)
      return NextResponse.json({ error: 'Aanvraag kon niet worden opgeslagen' }, { status: 500 })
    }

    // Send emails (non-blocking — don't fail request if email fails)
    await Promise.allSettled([
      sendApplicationReceivedEmail({
        to: email.trim().toLowerCase(),
        fullName: full_name.trim(),
        companyName: company_name.trim(),
      }),
      sendAdminNewApplicationEmail({
        companyName: company_name.trim(),
        fullName: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        kvkNumber: kvk_number.trim(),
        vatNumber: vat_number.trim().toUpperCase(),
        applicationId: application.id,
      }),
    ])

    return NextResponse.json({ success: true, id: application.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/account-applications]', error)
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 })
  }
}
