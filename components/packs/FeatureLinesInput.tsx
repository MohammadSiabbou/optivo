'use client'

/**
 * Controlled list-of-strings editor for pack feature lines.
 *
 * - Renders one <input> per non-empty line plus one blank trailing line.
 * - Pressing Enter or Tab in a line appends a new line below it.
 * - Backspace on an empty line removes it and focuses the previous one.
 * - Each line is capped at 120 characters.
 * - Remove button per line.
 * - Returns string[] (filtered, trimmed) to the parent via onChange.
 */
import { useRef } from 'react'
import { X, Plus } from 'lucide-react'
import { getMessage } from '@/lib/i18n'

interface FeatureLinesInputProps {
  value: string[]
  onChange: (lines: string[]) => void
  locale?: string
  /** Max lines (default: 30). */
  max?: number
}

export function FeatureLinesInput({
  value,
  onChange,
  locale = 'en',
  max = 30,
}: FeatureLinesInputProps) {
  // Internal: always maintain at least one entry so there's always an input visible
  const lines = value.length > 0 ? value : ['']
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  function updateLine(index: number, text: string) {
    const next = [...lines]
    next[index] = text.slice(0, 120)
    onChange(next)
  }

  function addLineAfter(index: number) {
    if (lines.length >= max) return
    const next = [...lines]
    next.splice(index + 1, 0, '')
    onChange(next)
    // Focus the new input after React re-render
    setTimeout(() => inputRefs.current[index + 1]?.focus(), 0)
  }

  function removeLine(index: number) {
    if (lines.length === 1) {
      onChange([''])
      return
    }
    const next = lines.filter((_, i) => i !== index)
    onChange(next)
    const focusIndex = Math.max(0, index - 1)
    setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addLineAfter(index)
    } else if (e.key === 'Backspace' && lines[index] === '' && lines.length > 1) {
      e.preventDefault()
      removeLine(index)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground/80">
        {getMessage(locale, 'packs.featuresLabel')}
      </p>

      <ul className="space-y-1.5" role="list" aria-label={getMessage(locale, 'packs.featuresLabel')}>
        {lines.map((line, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              value={line}
              onChange={(e) => updateLine(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              placeholder={getMessage(locale, 'packs.featureLinePlaceholder')}
              aria-label={`${getMessage(locale, 'packs.featuresLabel')} ${i + 1}`}
              maxLength={120}
              className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => removeLine(i)}
              aria-label={getMessage(locale, 'packs.removeFeatureLineAria')}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {lines.length < max && (
        <button
          type="button"
          onClick={() => addLineAfter(lines.length - 1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {getMessage(locale, 'packs.addFeatureLine')}
        </button>
      )}
    </div>
  )
}
