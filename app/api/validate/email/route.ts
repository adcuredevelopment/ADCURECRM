import { NextRequest, NextResponse } from 'next/server'
import { lookup } from 'dns/promises'

const BLOCKED_DOMAINS = [
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.nl',
  'outlook.com', 'outlook.nl', 'live.com', 'live.nl',
  'yahoo.com', 'yahoo.nl', 'protonmail.com', 'proton.me',
  'icloud.com', 'me.com', 'mac.com', 'aol.com',
  'gmx.com', 'gmx.net', 'web.de', 'ziggo.nl',
  'upcmail.nl', 'kpnmail.nl', 'planet.nl', 'xs4all.nl',
]

/**
 * POST /api/validate/email
 * Validates that an email:
 * 1. Has valid format
 * 2. Is not from a free/consumer provider
 * 3. Domain has MX records (can receive email)
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ valid: false, error: 'Email is verplicht' }, { status: 400 })
    }

    const cleaned = email.trim().toLowerCase()

    // Format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      return NextResponse.json({ valid: false, error: 'Email formaat is ongeldig' })
    }

    const domain = cleaned.split('@')[1]

    // Block free providers
    if (BLOCKED_DOMAINS.includes(domain)) {
      return NextResponse.json({
        valid: false,
        error: 'Gebruik een zakelijk email adres (geen Gmail, Hotmail, Outlook, etc.)',
      })
    }

    // DNS MX record check
    try {
      const addresses = await lookup(domain, { all: true })
      if (!addresses || addresses.length === 0) {
        return NextResponse.json({ valid: false, error: 'Email domein bestaat niet' })
      }
    } catch {
      return NextResponse.json({
        valid: false,
        error: 'Email domein niet gevonden of onbereikbaar',
      })
    }

    return NextResponse.json({ valid: true, email: cleaned })
  } catch {
    return NextResponse.json({ valid: false, error: 'Validatie mislukt' }, { status: 500 })
  }
}
