import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/validate/vat
 * Validates Dutch VAT number format + optional VIES API check.
 * Format: NL + 9 digits + B + 2 digits (e.g. NL123456789B01)
 * VIES API is public and free — no API key required.
 */
export async function POST(request: NextRequest) {
  try {
    const { vat } = await request.json()

    if (!vat || typeof vat !== 'string') {
      return NextResponse.json({ valid: false, error: 'BTW nummer is verplicht' }, { status: 400 })
    }

    const cleaned = vat.replace(/\s/g, '').toUpperCase()

    // Format check: NL + 9 digits + B + 2 digits
    if (!/^NL\d{9}B\d{2}$/.test(cleaned)) {
      return NextResponse.json({
        valid: false,
        error: 'BTW nummer moet het format NL123456789B01 hebben',
      })
    }

    // Optional: VIES API check (free, public)
    try {
      const vatNumber = cleaned.replace('NL', '')
      const viesUrl = `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/NL/vat/${vatNumber}`
      const viesResponse = await fetch(viesUrl, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (viesResponse.ok) {
        const viesData = await viesResponse.json()
        if (viesData.isValid === false) {
          return NextResponse.json({
            valid: false,
            error: 'BTW nummer niet gevonden bij de Belastingdienst',
          })
        }
        // isValid === true → verified
        return NextResponse.json({
          valid: true,
          vat: cleaned,
          companyName: viesData.name ?? null,
          verified: true,
        })
      }
    } catch {
      // VIES API timeout/down → fall through to format-only result
      console.warn('[validate/vat] VIES API unavailable, falling back to format-only')
    }

    // Format valid, VIES unavailable → accept with warning
    return NextResponse.json({ valid: true, vat: cleaned, verified: false })
  } catch {
    return NextResponse.json({ valid: false, error: 'Validatie mislukt' }, { status: 500 })
  }
}
