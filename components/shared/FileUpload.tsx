'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  /** Called with the public URL after a successful upload */
  onUpload: (url: string) => void
  /** Allowed MIME types (default: images + PDF) */
  accept?: string[]
}

const DEFAULT_ACCEPT = ['image/png', 'image/jpeg', 'application/pdf']

/**
 * Drag-and-drop file upload component.
 * Uploads to /api/upload and returns the public URL via onUpload callback.
 */
export function FileUpload({ onUpload, accept = DEFAULT_ACCEPT }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [isImage, setIsImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Upload failed')
        return
      }

      onUpload(data.url)
      setFilename(file.name)

      if (file.type.startsWith('image/')) {
        setIsImage(true)
        setPreview(URL.createObjectURL(file))
      } else {
        setIsImage(false)
        setPreview(null)
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadFile(acceptedFiles[0])
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDropRejected: (rejections) => {
      const reason = rejections[0]?.errors[0]?.message ?? 'File not accepted'
      setError(reason)
    },
  })

  const handleRemove = () => {
    setPreview(null)
    setFilename(null)
    setIsImage(false)
    setError(null)
    onUpload('')
  }

  // Show uploaded state
  if (filename && !loading) {
    return (
      <div className="rounded-xl border border-[#2A3040] bg-[#141920] p-4">
        <div className="flex items-center gap-3">
          {isImage && preview ? (
            <img
              src={preview}
              alt="Preview"
              className="h-12 w-12 rounded-lg object-cover border border-[#2A3040]"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2A3040]">
              <FileText className="h-6 w-6 text-[#94A3B8]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{filename}</p>
            <p className="text-xs text-[#10B981]">Uploaded successfully</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove file"
            className="rounded-lg p-1.5 text-[#94A3B8] transition-colors hover:bg-[#2A3040] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors',
          isDragActive
            ? 'border-[#2D7FF9] bg-[#2D7FF9]/5'
            : 'border-[#2A3040] bg-[#141920] hover:border-[#3A4050] hover:bg-[#1A1F2B]',
          loading && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />

        {loading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-[#2D7FF9]" />
            <p className="text-sm text-[#94A3B8]">Uploading...</p>
          </>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2A3040]">
              {isDragActive ? (
                <Image className="h-5 w-5 text-[#2D7FF9]" />
              ) : (
                <Upload className="h-5 w-5 text-[#94A3B8]" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-[#4A5568] mt-1">PNG, JPEG or PDF · max 5MB</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-[#EF4444]">{error}</p>
      )}
    </div>
  )
}

export default FileUpload
