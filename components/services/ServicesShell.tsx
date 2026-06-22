'use client'

/**
 * ServicesShell — standalone services editor.
 *
 * Shows OfferTypeStep (to toggle photo/video), then one ServiceCategoryStep
 * per active category, each with its own Save button (mode="standalone").
 */
import { useState } from 'react'
import { getMessage } from '@/lib/i18n'
import { OfferTypeStep } from './OfferTypeStep'
import { ServiceCategoryStep } from './ServiceCategoryStep'
import type { ServiceCatalog } from './ServiceCategoryStep'

interface ServicesShellProps {
  photoCatalog: ServiceCatalog
  videoCatalog: ServiceCatalog
  locale?: string
}

export function ServicesShell({
  photoCatalog,
  videoCatalog,
  locale = 'en',
}: ServicesShellProps) {
  const initialCategories: ('photo' | 'video')[] = []
  if (photoCatalog.selectedIds.length > 0 || photoCatalog.defaults.length > 0) {
    initialCategories.push('photo')
  }
  if (videoCatalog.selectedIds.length > 0) {
    initialCategories.push('video')
  }
  const [selectedCategories, setSelectedCategories] = useState<('photo' | 'video')[]>(
    initialCategories.length > 0 ? initialCategories : ['photo'],
  )

  const offersPhoto = selectedCategories.includes('photo')
  const offersVideo = selectedCategories.includes('video')

  return (
    <div className="space-y-10">
      {/* Offer type toggle */}
      <section aria-labelledby="offer-type-heading">
        <h2
          id="offer-type-heading"
          className="mb-4 text-base font-semibold text-foreground"
        >
          {getMessage(locale, 'services.offerQuestion')}
        </h2>
        <OfferTypeStep
          selected={selectedCategories}
          onChange={setSelectedCategories}
          locale={locale}
        />
      </section>

      {/* Photo services */}
      {offersPhoto && (
        <section aria-labelledby="photo-services-heading">
          <ServiceCategoryStep
            category="photo"
            catalog={photoCatalog}
            mode="standalone"
            locale={locale}
          />
        </section>
      )}

      {/* Video services */}
      {offersVideo && (
        <section aria-labelledby="video-services-heading">
          <ServiceCategoryStep
            category="video"
            catalog={videoCatalog}
            mode="standalone"
            locale={locale}
          />
        </section>
      )}
    </div>
  )
}
