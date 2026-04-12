import { NextRequest, NextResponse } from 'next/server'
import { isValidIBAN, electronicFormatIBAN } from 'ibantools'

/**
 * POST /api/validate/iban
 * Validates IBAN using the ibantools library (no external API needed).
 * Accepts any valid IBAN (not NL-only) to support international clients.
 */
export async function POST(request: NextRequest) {
  try {
    const { iban } = await request.json()

    if (!iban || typeof iban !== 'string') {
      return NextResponse.json({ valid: false, error: 'IBAN is verplicht' }, { status: 400 })
    }

    // Clean and normalize
    const cleaned = electronicFormatIBAN(iban.replace(/\s/g, '').toUpperCase()) ?? ''

    if (!cleaned) {
      return NextResponse.json({ valid: false, error: 'IBAN formaat is ongeldig' })
    }

    if (!isValidIBAN(cleaned)) {
      return NextResponse.json({
        valid: false,
        error: 'IBAN is niet geldig. Controleer het nummer (bijv. NL91ABNA0417164300)',
      })
    }

    return NextResponse.json({ valid: true, iban: cleaned })
  } catch {
    return NextResponse.json({ valid: false, error: 'Validatie mislukt' }, { status: 500 })
  }
}
