'use client'

/**
 * OfferTypeStep — first screen of the wizard.
 * Lets the studio choose Photo and/or Video (both allowed).
 */
import { Camera, Video } from 'lucide-react'
import { getMessage } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { ServiceCategory } from '@/modules/services/validation'

interface OfferTypeStepProps {
  selected: ServiceCategory[]
  onChange: (categories: ServiceCategory[]) => void
  locale?: string
}

const locale_default = 'en'

export function OfferTypeStep({
  selected,
  onChange,
  locale = locale_default,
}: OfferTypeStepProps) {
  function toggle(cat: ServiceCategory) {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat))
    } else {
      onChange([...selected, cat])
    }
  }

  const options: { cat: ServiceCategory; icon: typeof Camera; labelKey: string }[] = [
    { cat: 'photo', icon: Camera, labelKey: 'services.photoOption' },
    { cat: 'video', icon: Video,  labelKey: 'services.videoOption' },
  ]

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-foreground">
        {getMessage(locale, 'services.offerQuestion')}
      </p>
      <div className="grid grid-cols-2 gap-4">
        {options.map(({ cat, icon: Icon, labelKey }) => {
          const isSelected = selected.includes(cat)
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggle(cat)}
              aria-pressed={isSelected}
              className={cn(
                'flex flex-col items-center gap-3 rounded-xl border p-6 text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent',
              )}
            >
              <Icon className="h-8 w-8 shrink-0" aria-hidden="true" />
              {getMessage(locale, labelKey)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
