import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/validate/kvk
 * Format-only KVK validation (8 digits, no leading zeros).
 * No external API required.
 */
export async function POST(request: NextRequest) {
  try {
    const { kvk } = await request.json()

    if (!kvk || typeof kvk !== 'string') {
      return NextResponse.json({ valid: false, error: 'KVK nummer is verplicht' }, { status: 400 })
    }

    const cleaned = kvk.replace(/\s/g, '')

    if (!/^\d{8}$/.test(cleaned)) {
      return NextResponse.json({
        valid: false,
        error: 'KVK nummer moet exact 8 cijfers zijn (bijv. 12345678)',
      })
    }

    if (/^0+$/.test(cleaned)) {
      return NextResponse.json({
        valid: false,
        error: 'KVK nummer is ongeldig',
      })
    }

    return NextResponse.json({ valid: true, kvk: cleaned })
  } catch {
    return NextResponse.json({ valid: false, error: 'Validatie mislukt' }, { status: 500 })
  }
}
