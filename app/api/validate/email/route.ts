import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/validate/email
 * Validates that an email has a valid format.
 * No domain blocking — all email providers accepted.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ valid: false, error: 'Email is verplicht' }, { status: 400 })
    }

    const cleaned = email.trim().toLowerCase()

    // Format check only
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      return NextResponse.json({ valid: false, error: 'Email formaat is ongeldig' })
    }

    return NextResponse.json({ valid: true, email: cleaned })
  } catch {
    return NextResponse.json({ valid: false, error: 'Validatie mislukt' }, { status: 500 })
  }
}
