'use client'

/**
 * Social Media section of the Profile settings tab.
 * Allows the client to save links to their social profiles.
 */
import { useState } from 'react'
import { Instagram, Facebook, Linkedin, Twitter, CheckCircle2 } from 'lucide-react'
import { InputField, FormError } from '@/components/auth/FieldAtoms'
import { getMessage } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import type { SafeClient } from '@/modules/clients/usecases/RegisterClientUseCase'

interface Props {
  client: SafeClient
  locale?: string
}

interface SocialField {
  key: keyof Pick<SafeClient, 'instagram_url' | 'facebook_url' | 'linkedin_url' | 'twitter_url'>
  labelKey: string
  icon: React.ReactNode
  placeholder: string
}

const SOCIAL_FIELDS: SocialField[] = [
  {
    key: 'instagram_url',
    labelKey: 'settings.profile.socials.instagramLabel',
    icon: <Instagram className="size-4 text-muted-foreground" aria-hidden="true" />,
    placeholder: 'https://instagram.com/yourstudio',
  },
  {
    key: 'facebook_url',
    labelKey: 'settings.profile.socials.facebookLabel',
    icon: <Facebook className="size-4 text-muted-foreground" aria-hidden="true" />,
    placeholder: 'https://facebook.com/yourstudio',
  },
  {
    key: 'linkedin_url',
    labelKey: 'settings.profile.socials.linkedinLabel',
    icon: <Linkedin className="size-4 text-muted-foreground" aria-hidden="true" />,
    placeholder: 'https://linkedin.com/in/yourprofile',
  },
  {
    key: 'twitter_url',
    labelKey: 'settings.profile.socials.twitterLabel',
    icon: <Twitter className="size-4 text-muted-foreground" aria-hidden="true" />,
    placeholder: 'https://x.com/yourstudio',
  },
]

type FieldErrors = Partial<Record<SocialField['key'], string>>

export function SocialsForm({ client, locale = 'en' }: Props) {
  const [values, setValues] = useState<Record<SocialField['key'], string>>({
    instagram_url: client.instagram_url ?? '',
    facebook_url: client.facebook_url ?? '',
    linkedin_url: client.linkedin_url ?? '',
    twitter_url: client.twitter_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)

  function setValue(key: SocialField['key'], val: string) {
    setValues((prev) => ({ ...prev, [key]: val }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    setSaving(true)
    try {
      const res = await fetch(ROUTES.api.clients.updateSocials, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
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
        {SOCIAL_FIELDS.map(({ key, labelKey, icon, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <label htmlFor={`social-${key}`} className="block text-sm font-medium text-foreground/80">
              {getMessage(locale, labelKey)}
            </label>
            <div className="relative flex items-center">
              <span className={cn(
                'pointer-events-none absolute left-3 flex items-center',
              )}>
                {icon}
              </span>
              <input
                id={`social-${key}`}
                type="url"
                value={values[key]}
                onChange={(e) => setValue(key, e.target.value)}
                placeholder={placeholder}
                aria-invalid={!!fieldErrors[key]}
                aria-describedby={fieldErrors[key] ? `social-${key}-error` : undefined}
                className={cn(
                  'w-full rounded-lg border bg-muted/40 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
                  'transition-colors outline-none',
                  'focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/30',
                  fieldErrors[key]
                    ? 'border-destructive focus:border-destructive focus:ring-destructive/25'
                    : 'border-border',
                )}
              />
            </div>
            {fieldErrors[key] && (
              <p id={`social-${key}-error`} role="alert" className="text-xs text-destructive mt-1">
                {fieldErrors[key]}
              </p>
            )}
          </div>
        ))}

        <FormError message={error} />

        {success && (
          <p role="status" className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            {getMessage(locale, 'settings.profile.socials.savedSuccess')}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60 hover:opacity-90"
          >
            {saving
              ? getMessage(locale, 'settings.profile.socials.saving')
              : getMessage(locale, 'settings.profile.socials.saveButton')}
          </button>
        </div>
      </div>
    </form>
  )
}
