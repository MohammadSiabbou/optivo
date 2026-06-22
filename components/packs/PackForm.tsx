'use client'

/**
 * PackForm — create or edit a single pack.
 *
 * Props control whether it's in create or edit mode.
 * onSaved is called with the new/updated PackDTO after a successful save.
 * onCancel dismisses without saving.
 */
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getMessage } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'
import { InputField, FormError } from '@/components/auth/FieldAtoms'
import { FeatureLinesInput } from './FeatureLinesInput'
import { PackImageManager } from './PackImageManager'
import type { PackDTO } from '@/modules/packs/usecases/types'

interface PackFormProps {
  /** Provide an existing pack to switch to edit mode. */
  pack?: PackDTO | null
  locale?: string
  onSaved: (pack: PackDTO) => void
  onCancel: () => void
}

export function PackForm({ pack, locale = 'en', onSaved, onCancel }: PackFormProps) {
  const isEdit = !!pack

  const [name, setName] = useState(pack?.name ?? '')
  const [price, setPrice] = useState(pack?.price !== undefined ? String(pack.price) : '')
  const [oldPrice, setOldPrice] = useState(
    pack?.oldPrice !== undefined && pack.oldPrice !== null ? String(pack.oldPrice) : '',
  )
  const [features, setFeatures] = useState<string[]>(pack?.features ?? [''])
  const [primaryUrl, setPrimaryUrl] = useState<string | null>(pack?.primaryImageUrl ?? null)
  const [galleryUrls, setGalleryUrls] = useState<string[]>(pack?.imageUrls ?? [])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setFormError(null)
    setSaving(true)

    const payload = {
      name: name.trim(),
      price: price === '' ? '' : Number(price),
      old_price: oldPrice === '' ? null : Number(oldPrice),
      primary_image_url: primaryUrl,
      image_urls: galleryUrls,
      features: features.map((f) => f.trim()).filter(Boolean),
    }

    try {
      const url = isEdit
        ? `${ROUTES.api.packs.list}/${pack.id}`
        : ROUTES.api.packs.list
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok) {
        if (json.errors) {
          setErrors(json.errors)
        } else {
          setFormError(json.error ?? getMessage(locale, 'auth.common.unexpectedError'))
        }
        return
      }

      onSaved(json as PackDTO)
    } catch {
      setFormError(getMessage(locale, 'auth.common.unexpectedError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <InputField
        label={getMessage(locale, 'packs.nameLabel')}
        id="pack-name"
        name="name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        errorId="pack-name-error"
        required
        autoComplete="off"
      />

      <div className="grid grid-cols-2 gap-4">
        <InputField
          label={getMessage(locale, 'packs.priceLabel')}
          id="pack-price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={errors.price}
          errorId="pack-price-error"
          required
        />
        <div className="space-y-1">
          <InputField
            label={getMessage(locale, 'packs.oldPriceLabel')}
            id="pack-old-price"
            name="old_price"
            type="number"
            min="0"
            step="0.01"
            value={oldPrice}
            onChange={(e) => setOldPrice(e.target.value)}
            error={errors.old_price}
            errorId="pack-old-price-error"
          />
          <p className="text-xs text-muted-foreground">
            {getMessage(locale, 'packs.oldPriceHint')}
          </p>
        </div>
      </div>

      {/* Primary image + gallery */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground/80">
          {getMessage(locale, 'packs.primaryImageLabel')}
        </p>
        {errors.primary_image_url && (
          <p role="alert" className="text-sm text-destructive">
            {errors.primary_image_url}
          </p>
        )}
        <PackImageManager
          primaryUrl={primaryUrl}
          galleryUrls={galleryUrls}
          onPrimaryChange={setPrimaryUrl}
          onGalleryChange={setGalleryUrls}
          locale={locale}
        />
      </div>

      {/* Feature lines */}
      <FeatureLinesInput value={features} onChange={setFeatures} locale={locale} />
      {errors.features && (
        <p role="alert" className="text-sm text-destructive">
          {errors.features}
        </p>
      )}

      <FormError message={formError} />

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {getMessage(locale, 'packs.cancelButton')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60 hover:opacity-90"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {saving
            ? getMessage(locale, 'packs.saving')
            : getMessage(locale, 'packs.saveButton')}
        </button>
      </div>
    </form>
  )
}
