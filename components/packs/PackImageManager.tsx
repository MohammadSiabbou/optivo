'use client'

/**
 * Pack image manager.
 *
 * Manages a primary image + up to 10 total gallery images.
 * Uses ImageUploader for uploads; displays thumbnails with set-primary and remove controls.
 */
import Image from 'next/image'
import { Star, X } from 'lucide-react'
import { getMessage } from '@/lib/i18n'
import { ImageUploader } from '@/components/common/ImageUploader'
import { ROUTES } from '@/lib/routes'
import { PACK_MAX_IMAGES } from '@/modules/packs/validation'
import { cn } from '@/lib/utils'

interface PackImageManagerProps {
  primaryUrl: string | null
  galleryUrls: string[]
  onPrimaryChange: (url: string | null) => void
  onGalleryChange: (urls: string[]) => void
  locale?: string
}

export function PackImageManager({
  primaryUrl,
  galleryUrls,
  onPrimaryChange,
  onGalleryChange,
  locale = 'en',
}: PackImageManagerProps) {
  const allUrls = [
    ...(primaryUrl ? [primaryUrl] : []),
    ...galleryUrls,
  ]
  const canAddMore = allUrls.length < PACK_MAX_IMAGES

  function handleNewUpload(url: string) {
    // Re-derive allUrls at call time so parallel uploads stack correctly
    const currentAll = [...(primaryUrl ? [primaryUrl] : []), ...galleryUrls]
    if (!primaryUrl) {
      onPrimaryChange(url)
    } else if (currentAll.length < PACK_MAX_IMAGES) {
      onGalleryChange([...galleryUrls, url])
    }
  }

  function setPrimary(url: string) {
    if (url === primaryUrl) return
    // Move current primary to front of gallery, promote selected to primary
    const newGallery = allUrls.filter((u) => u !== url)
    onPrimaryChange(url)
    onGalleryChange(newGallery.filter((u) => u !== primaryUrl).concat(primaryUrl ? [primaryUrl] : []))
  }

  function removeImage(url: string) {
    if (url === primaryUrl) {
      const [newPrimary, ...rest] = galleryUrls
      onPrimaryChange(newPrimary ?? null)
      onGalleryChange(rest)
    } else {
      onGalleryChange(galleryUrls.filter((u) => u !== url))
    }
  }

  return (
    <div className="space-y-3">
      {/* Thumbnail grid */}
      {allUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {allUrls.map((url) => {
            const isPrimary = url === primaryUrl
            return (
              <div
                key={url}
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-lg border-2 transition-colors',
                  isPrimary ? 'border-primary' : 'border-border',
                )}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
                {/* Overlay controls — visible on hover */}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(url)}
                      aria-label={getMessage(locale, 'packs.setPrimaryAria')}
                      className="rounded-md bg-white/20 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    aria-label={getMessage(locale, 'packs.removeImageAria')}
                    className="rounded-md bg-white/20 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-destructive/80"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                {isPrimary && (
                  <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                    {getMessage(locale, 'packs.primaryImageLabel')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        {getMessage(locale, 'packs.imageCountHint')}
      </p>

      {/* Upload zone (hidden once limit reached) */}
      {canAddMore && (
        <ImageUploader
          uploadUrl={ROUTES.api.packs.uploadImage}
          locale={locale}
          ariaLabel={getMessage(locale, 'packs.galleryLabel')}
          multiple
          maxFiles={PACK_MAX_IMAGES - allUrls.length}
          onUploadComplete={handleNewUpload}
          onClear={() => {}}
        />
      )}
    </div>
  )
}
