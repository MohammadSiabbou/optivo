'use client'

/**
 * ServiceCard — presentational card for a single service definition.
 * Shows the icon, label, and a selected ring when active.
 */
import { getIcon } from './iconMap'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  icon: string
  label: string
  selected: boolean
  onToggle: () => void
  onRemove?: () => void
  removeAriaLabel?: string
}

export function ServiceCard({
  icon,
  label,
  selected,
  onToggle,
  onRemove,
  removeAriaLabel,
}: ServiceCardProps) {
  const Icon = getIcon(icon)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={cn(
          'flex w-full flex-col items-center gap-2 rounded-xl border p-4 text-center text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          selected
            ? 'border-primary bg-primary/5 text-primary shadow-sm'
            : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent',
        )}
      >
        <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
        <span className="leading-snug text-balance">{label}</span>
      </button>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          aria-label={removeAriaLabel ?? `Remove ${label}`}
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden="true" className="text-xs leading-none">
            ×
          </span>
        </button>
      )}
    </div>
  )
}
