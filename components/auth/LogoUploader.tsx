'use client'

/**
 * Logo upload field with:
 * - 5 MB hard limit (error)
 * - Dimension check with amber warning (non-blocking) if outside preferred range
 * - Drag-and-drop + click-to-upload
 * - Live preview thumbnail
 */
import { useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon } from 'lucide-react'
import { LOGO_MAX_BYTES, LOGO_PREFERRED, logoSizeWarning } from '@/lib/validation/client'
import { FieldError, FieldWarning } from './FieldAtoms'
import { cn } from '@/lib/utils'

interface LogoUploaderProps {
  onUploadComplete: (url: string) => void
  onClear: () => void
}

export function LogoUploader({ onUploadComplete, onClear }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [sizeError, setSizeError] = useState<string | null>(null)
  const [dimensionWarning, setDimensionWarning] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const processFile = useCallback(
    async (file: File) => {
      setSizeError(null)
      setDimensionWarning(null)
      setUploadError(null)

      // 1. Size check
      if (file.size > LOGO_MAX_BYTES) {
        setSizeError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`)
        return
      }

      // 2. Local preview + dimension check
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      setFileName(file.name)

      const img = new window.Image()
      img.onload = () => {
        const warn = logoSizeWarning(img.naturalWidth, img.naturalHeight)
        setDimensionWarning(warn)
        URL.revokeObjectURL(objectUrl)
      }
      img.src = objectUrl

      // 3. Upload
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/clients/upload-logo', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) {
          setUploadError(json.error ?? 'Upload failed.')
          setPreview(null)
          setFileName(null)
          return
        }
        onUploadComplete(json.url)
      } catch {
        setUploadError('Upload failed. Please try again.')
        setPreview(null)
        setFileName(null)
      } finally {
        setUploading(false)
      }
    },
    [onUploadComplete],
  )

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    processFile(files[0])
  }

  const handleClear = () => {
    setPreview(null)
    setFileName(null)
    setSizeError(null)
    setDimensionWarning(null)
    setUploadError(null)
    if (inputRef.current) inputRef.current.value = ''
    onClear()
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground/80">
        Studio logo <span className="text-muted-foreground font-normal">(optional)</span>
      </label>

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        Preferred dimensions: <span className="font-medium text-foreground/70">400 × 120 px</span> — PNG or SVG recommended. Max 5 MB.
      </p>

      {preview ? (
        /* Preview state */
        <div className="relative flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="relative h-12 w-24 shrink-0 overflow-hidden rounded">
            <Image src={preview} alt="Logo preview" fill className="object-contain" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{fileName}</p>
            {uploading && (
              <p className="text-xs text-muted-foreground mt-0.5">Uploading…</p>
            )}
            {!uploading && !uploadError && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Uploaded</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Remove logo"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
          disabled={uploading}
          className={cn(
            'w-full rounded-lg border-2 border-dashed px-6 py-8 flex flex-col items-center gap-2 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            isDragging
              ? 'border-ring bg-muted/50'
              : 'border-border bg-muted/20 hover:border-ring/60 hover:bg-muted/30',
          )}
          aria-label="Upload logo — click or drag and drop"
        >
          <ImageIcon className="size-7 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground/70">Click to upload</span> or drag &amp; drop
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <FieldError message={sizeError ?? uploadError ?? undefined} />
      <FieldWarning message={dimensionWarning} />
    </div>
  )
}
