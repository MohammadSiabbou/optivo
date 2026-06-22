'use client'

/**
 * PacksStep — wizard-friendly wrapper around PackList + PackForm.
 *
 * Lets the user add zero or more packs then continue/finish.
 * In wizard mode the "Skip" / "Finish" buttons are provided by the parent (OnboardingWizard);
 * this component just manages local CRUD state and exposes the current pack list.
 */
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { getMessage } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'
import { PackList } from './PackList'
import { PackForm } from './PackForm'
import type { PackDTO } from '@/modules/packs/usecases/types'

interface PacksStepProps {
  initialPacks: PackDTO[]
  locale?: string
  /** Called whenever the packs list changes, so the wizard can track state. */
  onPacksChange?: (packs: PackDTO[]) => void
}

export function PacksStep({
  initialPacks,
  locale = 'en',
  onPacksChange,
}: PacksStepProps) {
  const [packs, setPacks] = useState<PackDTO[]>(initialPacks)
  const [editingPack, setEditingPack] = useState<PackDTO | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function updatePacks(next: PackDTO[]) {
    setPacks(next)
    onPacksChange?.(next)
  }

  function handleSaved(savedPack: PackDTO) {
    if (editingPack) {
      updatePacks(packs.map((p) => (p.id === savedPack.id ? savedPack : p)))
    } else {
      updatePacks([...packs, savedPack])
    }
    setEditingPack(null)
    setShowForm(false)
  }

  function handleEdit(pack: PackDTO) {
    setEditingPack(pack)
    setShowForm(true)
  }

  async function handleDelete(pack: PackDTO) {
    setDeleteError(null)
    try {
      const res = await fetch(`${ROUTES.api.packs.list}/${pack.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setDeleteError(json.error ?? getMessage(locale, 'auth.common.unexpectedError'))
        return
      }
      updatePacks(packs.filter((p) => p.id !== pack.id))
    } catch {
      setDeleteError(getMessage(locale, 'auth.common.unexpectedError'))
    }
  }

  function handleCancel() {
    setEditingPack(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground text-balance">
          {getMessage(locale, 'packs.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {getMessage(locale, 'packs.description')}
        </p>
      </div>

      {deleteError && (
        <p role="alert" className="text-sm text-destructive">
          {deleteError}
        </p>
      )}

      {!showForm && (
        <>
          <PackList
            packs={packs}
            mode="standalone"
            locale={locale}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <button
            type="button"
            onClick={() => {
              setEditingPack(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {getMessage(locale, 'packs.addPack')}
          </button>
        </>
      )}

      {showForm && (
        <PackForm
          pack={editingPack}
          locale={locale}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
