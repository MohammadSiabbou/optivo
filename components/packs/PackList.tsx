'use client'

/**
 * PackList — lists existing packs with edit and delete controls.
 *
 * Used by:
 *   - Standalone /packs page (mode="standalone")
 *   - Wizard packs step summary (mode="wizard", no edit/delete)
 */
import Image from 'next/image'
import { Pencil, Trash2 } from 'lucide-react'
import { getMessage } from '@/lib/i18n'
import type { PackDTO } from '@/modules/packs/usecases/types'

interface PackListProps {
  packs: PackDTO[]
  mode: 'standalone' | 'wizard'
  locale?: string
  onEdit?: (pack: PackDTO) => void
  onDelete?: (pack: PackDTO) => void
}

export function PackList({
  packs,
  mode,
  locale = 'en',
  onEdit,
  onDelete,
}: PackListProps) {
  if (packs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {getMessage(locale, 'packs.emptyState')}
      </p>
    )
  }

  return (
    <ul className="space-y-3" role="list">
      {packs.map((pack) => (
        <li
          key={pack.id}
          className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
        >
          {/* Primary image thumbnail */}
          {pack.primaryImageUrl ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={pack.primaryImageUrl}
                alt={pack.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
              <span className="text-xs text-muted-foreground">No image</span>
            </div>
          )}

          {/* Info */}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate font-medium text-foreground">{pack.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {pack.price}
              </span>
              {pack.oldPrice !== null && pack.oldPrice !== undefined && (
                <span className="text-sm text-muted-foreground line-through">
                  {pack.oldPrice}
                </span>
              )}
            </div>
            {pack.features.length > 0 && (
              <ul className="space-y-0.5" aria-label={getMessage(locale, 'packs.featuresLabel')}>
                {pack.features.slice(0, 3).map((f, i) => (
                  <li key={i} className="truncate text-xs text-muted-foreground">
                    {f}
                  </li>
                ))}
                {pack.features.length > 3 && (
                  <li className="text-xs text-muted-foreground">
                    +{pack.features.length - 3} more
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Actions */}
          {mode === 'standalone' && (
            <div className="flex shrink-0 items-center gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(pack)}
                  aria-label={`${getMessage(locale, 'packs.editPack')}: ${pack.name}`}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(pack)}
                  aria-label={`${getMessage(locale, 'packs.deletePack')}: ${pack.name}`}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
