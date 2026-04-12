import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

/**
 * POST /api/upload
 * Accepts a FormData `file` field, validates it, and uploads to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Use PNG, JPEG, or PDF.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename: userId/timestamp-originalname
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${user.id}/${timestamp}-${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('transaction-proofs')
      .upload(filename, buffer, { contentType: file.type })

    if (uploadError) {
      console.error('[POST /api/upload] Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('transaction-proofs')
      .getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('[POST /api/upload]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
