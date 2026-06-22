'use client'

/**
 * ServiceCategoryStep — reusable "select services for a category" screen.
 *
 * Used in both the wizard (mode="wizard") and standalone pages (mode="standalone").
 * In wizard mode the parent calls onSaved when "Next" is clicked; in standalone
 * mode the component renders its own Save button.
 */
import { useState } from 'react'
import { CheckCircle2, Plus, Loader2 } from 'lucide-react'
import { getMessage } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'
import type { ServiceDefinitionDTO } from '@/modules/services/usecases/types'
import type { ServiceCategory } from '@/modules/services/validation'
import { ServiceCard } from './ServiceCard'

export interface ServiceCatalog {
  defaults: ServiceDefinitionDTO[]
  custom: ServiceDefinitionDTO[]
  selectedIds: string[]
}

interface ServiceCategoryStepProps {
  category: ServiceCategory
  catalog: ServiceCatalog
  mode: 'wizard' | 'standalone'
  locale?: string
  /** Called after successful save; wizard uses this to advance to next step. */
  onSaved?: (catalog: ServiceCatalog) => void
}

const DEFAULT_LOCALE = 'en'

export function ServiceCategoryStep({
  category,
  catalog: initialCatalog,
  mode,
  locale = DEFAULT_LOCALE,
  onSaved,
}: ServiceCategoryStepProps) {
  const [catalog, setCatalog] = useState(initialCatalog)
  const [selected, setSelected] = useState<Set<string>>(new Set(initialCatalog.selectedIds))
  const [customInputs, setCustomInputs] = useState<{ id: string; label: string }[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function toggleDefinition(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addCustomInput() {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    setCustomInputs((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, label: trimmed },
    ])
    setNewLabel('')
  }

  function removeCustomInput(id: string) {
    setCustomInputs((prev) => prev.filter((c) => c.id !== id))
  }

  function removeExistingCustom(defId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(defId)
      return next
    })
    setCatalog((prev) => ({
      ...prev,
      custom: prev.custom.filter((c) => c.id !== defId),
    }))
    // Fire-and-forget delete; ignore errors silently here
    fetch(`${ROUTES.api.services.custom}?id=${defId}`, { method: 'DELETE' })
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(ROUTES.api.services.selection, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          definitionIds: Array.from(selected),
          customServices: customInputs.map((c) => ({ label: c.label })),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? getMessage(locale, 'auth.common.unexpectedError'))
        return
      }
      const updatedCatalog: ServiceCatalog = json
      setCatalog(updatedCatalog)
      setSelected(new Set(updatedCatalog.selectedIds))
      setCustomInputs([])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      onSaved?.(updatedCatalog)
    } catch {
      setError(getMessage(locale, 'auth.common.unexpectedError'))
    } finally {
      setSaving(false)
    }
  }

  const allDefinitions = [...catalog.defaults, ...catalog.custom]

  const titleKey = category === 'photo' ? 'services.photo.title' : 'services.video.title'
  const descKey = category === 'photo' ? 'services.photo.description' : 'services.video.description'

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground text-balance">
          {getMessage(locale, titleKey)}
        </h2>
        <p className="text-sm text-muted-foreground">{getMessage(locale, descKey)}</p>
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {allDefinitions.map((def) => {
          const label = def.customLabel ?? getMessage(locale, def.nameKey ?? '') ?? def.nameKey ?? ''
          return (
            <ServiceCard
              key={def.id}
              icon={def.icon}
              label={label}
              selected={selected.has(def.id)}
              onToggle={() => toggleDefinition(def.id)}
              onRemove={
                def.isCustom
                  ? () => removeExistingCustom(def.id)
                  : undefined
              }
              removeAriaLabel={
                def.isCustom
                  ? getMessage(locale, 'services.removeCustomAria').replace('{label}', label)
                  : undefined
              }
            />
          )
        })}

        {/* Unsaved custom cards (local state) */}
        {customInputs.map((c) => (
          <ServiceCard
            key={c.id}
            icon="Camera"
            label={c.label}
            selected
            onToggle={() => {}}
            onRemove={() => removeCustomInput(c.id)}
            removeAriaLabel={getMessage(locale, 'services.removeCustomAria').replace('{label}', c.label)}
          />
        ))}
      </div>

      {/* Add custom service */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomInput())}
          placeholder={getMessage(locale, 'services.customLabelPlaceholder')}
          aria-label={getMessage(locale, 'services.customLabelAria')}
          maxLength={80}
          className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={addCustomInput}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {getMessage(locale, 'services.addCustom')}
        </button>
      </div>

      {/* Errors + success */}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {success && mode === 'standalone' && (
        <p role="status" className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {getMessage(locale, 'services.savedSuccess')}
        </p>
      )}

      {/* Standalone save button */}
      {mode === 'standalone' && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60 hover:opacity-90"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {saving ? getMessage(locale, 'services.saving') : getMessage(locale, 'services.saveButton')}
          </button>
        </div>
      )}
    </div>
  )
}

// Export the save fn for wizard usage (wizard calls it from its "Next" handler)
export type { ServiceCategoryStepProps }
