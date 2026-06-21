'use client'

/**
 * Basic Info section of the Profile settings tab.
 * Allows the client to update their studio name and logo.
 */
import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import { InputField, FormError } from '@/components/auth/FieldAtoms'
import { LogoUploader } from '@/components/auth/LogoUploader'
import { getMessage } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'
import type { SafeClient } from '@/modules/clients/usecases/RegisterClientUseCase'

interface Props {
  client: SafeClient
  locale?: string
}

export function BasicInfoForm({ client, locale = 'en' }: Props) {
  const [name, setName] = useState(client.name)
  const [logoUrl, setLogoUrl] = useState<string | null>(client.logo_url)
  const [logoCleared, setLogoCleared] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [nameError, setNameError] = useState<string | undefined>()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setNameError(undefined)

    if (!name.trim()) {
      setNameError(getMessage(locale, 'auth.validation.nameRequired'))
      return
    }

    setSaving(true)
    try {
      const res = await fetch(ROUTES.api.clients.updateProfile, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          logo_url: logoCleared ? null : logoUrl,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? getMessage(locale, 'auth.common.unexpectedError'))
        return
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      setError(getMessage(locale, 'auth.common.unexpectedError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        <InputField
          label={getMessage(locale, 'settings.profile.basicInfo.nameLabel')}
          id="settings-name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          errorId="settings-name-error"
          required
          autoComplete="organization"
        />

        {/* Current logo preview (if set and not yet replaced) */}
        {client.logo_url && !logoCleared && logoUrl === client.logo_url && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground/80">
              {getMessage(locale, 'settings.profile.basicInfo.logoLabel')}
            </p>
            <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="relative h-10 w-24 shrink-0 overflow-hidden rounded">
                <Image
                  src={client.logo_url}
                  alt={getMessage(locale, 'nav.logoAlt').replace('{name}', client.name)}
                  fill
                  className="object-contain"
                />
              </div>
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline transition-colors"
                onClick={() => {
                  setLogoUrl(null)
                  setLogoCleared(true)
                }}
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Upload new logo */}
        {(!client.logo_url || logoCleared || logoUrl !== client.logo_url) && (
          <LogoUploader
            locale={locale}
            onUploadComplete={(url) => {
              setLogoUrl(url)
              setLogoCleared(false)
            }}
            onClear={() => {
              setLogoUrl(null)
              setLogoCleared(true)
            }}
          />
        )}

        <FormError message={error} />

        {success && (
          <p role="status" className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            {getMessage(locale, 'settings.profile.basicInfo.savedSuccess')}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60 hover:opacity-90"
          >
            {saving
              ? getMessage(locale, 'settings.profile.basicInfo.saving')
              : getMessage(locale, 'settings.profile.basicInfo.saveButton')}
          </button>
        </div>
      </div>
    </form>
  )
}
