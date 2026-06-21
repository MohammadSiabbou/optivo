'use client'

/**
 * Shared image uploader component.
 *
 * Supports drag-and-drop + click-to-upload.
 * Calls the supplied uploadUrl endpoint (POST multipart/form-data with field "file").
 * Returns the uploaded URL via onUploadComplete.
 *
 * Used by both the logo uploader and the pack image manager.
 */
import { useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { getMessage } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { FieldError } from '@/components/auth/FieldAtoms'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

interface ImageUploaderProps {
  /** POST endpoint that accepts `file` in FormData and returns `{ url: string }`. */
  uploadUrl: string
  /** Accept string for the file input (default: "image/*"). */
  accept?: string
  /** Label shown above the drop zone. */
  label?: string
  /** aria-label for the drop-zone button. */
  ariaLabel?: string
  locale?: string
  onUploadComplete?: (url: string) => void
  onClear?: () => void
  /** If provided, show as the current image instead of the drop zone. */
  currentUrl?: string | null
  className?: string
}

export function ImageUploader({
  uploadUrl,
  accept = 'image/*',
  label,
  ariaLabel,
  locale = 'en',
  onUploadComplete,
  onClear,
  currentUrl,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const processFile = useCallback(
    async (file: File) => {
      setError(null)

      if (file.size > MAX_BYTES) {
        setError(
          getMessage(locale, 'auth.validation.fileTooLarge', {
            size: (file.size / 1024 / 1024).toFixed(1),
          }),
        )
        return
      }

      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      setFileName(file.name)
      setUploading(true)

      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(uploadUrl, { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? getMessage(locale, 'auth.common.uploadFailed'))
          setPreview(null)
          setFileName(null)
          URL.revokeObjectURL(objectUrl)
          return
        }
        onUploadComplete?.(json.url)
        URL.revokeObjectURL(objectUrl)
      } catch {
        setError(getMessage(locale, 'auth.common.uploadFailed'))
        setPreview(null)
        setFileName(null)
        URL.revokeObjectURL(objectUrl)
      } finally {
        setUploading(false)
      }
    },
    [uploadUrl, locale, onUploadComplete],
  )

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    processFile(files[0])
  }

  function handleClear() {
    setPreview(null)
    setFileName(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    onClear?.()
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <p className="text-sm font-medium text-foreground/80">{label}</p>
      )}

      {preview ? (
        <div className="relative flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded">
            <Image
              src={preview}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            {fileName && (
              <p className="truncate text-xs font-medium text-foreground">{fileName}</p>
            )}
            {uploading && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                {getMessage(locale, 'auth.common.uploading')}
              </p>
            )}
            {!uploading && !error && (
              <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                {getMessage(locale, 'auth.common.uploaded')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            aria-label={getMessage(locale, 'auth.common.removeLogoAriaLabel')}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
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
          aria-label={ariaLabel ?? getMessage(locale, 'auth.common.uploadLogo')}
          className={cn(
            'flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            isDragging
              ? 'border-ring bg-muted/50'
              : 'border-border bg-muted/20 hover:border-ring/60 hover:bg-muted/30',
          )}
        >
          {uploading ? (
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          ) : (
            <ImageIcon className="h-7 w-7 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground/70">
              {getMessage(locale, 'auth.common.clickUpload')}
            </span>{' '}
            {getMessage(locale, 'auth.common.dragDrop')}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <FieldError message={error ?? undefined} />
    </div>
  )
}
