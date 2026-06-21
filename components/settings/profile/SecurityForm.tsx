'use client'

/**
 * Security section of the Profile settings tab.
 * Allows the client to change their account password.
 */
import { useState } from 'react'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { FormError } from '@/components/auth/FieldAtoms'
import { getMessage } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

interface Props {
  locale?: string
}

interface PasswordField {
  id: string
  labelKey: string
  stateKey: 'currentPassword' | 'newPassword' | 'confirmNewPassword'
  showKey: 'showCurrent' | 'showNew' | 'showConfirm'
  autoComplete: string
}

const PASSWORD_FIELDS: PasswordField[] = [
  {
    id: 'security-current',
    labelKey: 'settings.profile.security.currentPasswordLabel',
    stateKey: 'currentPassword',
    showKey: 'showCurrent',
    autoComplete: 'current-password',
  },
  {
    id: 'security-new',
    labelKey: 'settings.profile.security.newPasswordLabel',
    stateKey: 'newPassword',
    showKey: 'showNew',
    autoComplete: 'new-password',
  },
  {
    id: 'security-confirm',
    labelKey: 'settings.profile.security.confirmPasswordLabel',
    stateKey: 'confirmNewPassword',
    showKey: 'showConfirm',
    autoComplete: 'new-password',
  },
]

type Values = Record<'currentPassword' | 'newPassword' | 'confirmNewPassword', string>
type ShowState = Record<'showCurrent' | 'showNew' | 'showConfirm', boolean>
type FieldErrors = Partial<Values>

export function SecurityForm({ locale = 'en' }: Props) {
  const [values, setValues] = useState<Values>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [show, setShow] = useState<ShowState>({
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)

  function setValue(key: keyof Values, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function toggleShow(key: keyof ShowState) {
    setShow((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    setSaving(true)
    try {
      const res = await fetch(ROUTES.api.clients.changeSecurity, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (res.status === 204) {
        setValues({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
        setSuccess(true)
        setTimeout(() => setSuccess(false), 4000)
        return
      }

      const json = await res.json()
      setError(json.error ?? getMessage(locale, 'auth.common.unexpectedError'))
    } catch {
      setError(getMessage(locale, 'auth.common.unexpectedError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5">
        {PASSWORD_FIELDS.map(({ id, labelKey, stateKey, showKey, autoComplete }) => (
          <div key={id} className="space-y-1.5">
            <label htmlFor={id} className="block text-sm font-medium text-foreground/80">
              {getMessage(locale, labelKey)}
              <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                id={id}
                type={show[showKey] ? 'text' : 'password'}
                value={values[stateKey]}
                onChange={(e) => setValue(stateKey, e.target.value)}
                autoComplete={autoComplete}
                required
                aria-invalid={!!fieldErrors[stateKey]}
                aria-describedby={fieldErrors[stateKey] ? `${id}-error` : undefined}
                className={cn(
                  'w-full rounded-lg border bg-muted/40 px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground',
                  'transition-colors outline-none',
                  'focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/30',
                  fieldErrors[stateKey]
                    ? 'border-destructive focus:border-destructive focus:ring-destructive/25'
                    : 'border-border',
                )}
              />
              <button
                type="button"
                onClick={() => toggleShow(showKey)}
                aria-label={
                  show[showKey]
                    ? getMessage(locale, 'auth.common.hidePassword')
                    : getMessage(locale, 'auth.common.showPassword')
                }
                className="absolute right-2.5 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                {show[showKey]
                  ? <EyeOff className="size-4" aria-hidden="true" />
                  : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </div>
            {fieldErrors[stateKey] && (
              <p id={`${id}-error`} role="alert" className="text-xs text-destructive mt-1">
                {fieldErrors[stateKey]}
              </p>
            )}
          </div>
        ))}

        <FormError message={error} />

        {success && (
          <p role="status" className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            {getMessage(locale, 'settings.profile.security.savedSuccess')}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60 hover:opacity-90"
          >
            {saving
              ? getMessage(locale, 'settings.profile.security.saving')
              : getMessage(locale, 'settings.profile.security.saveButton')}
          </button>
        </div>
      </div>
    </form>
  )
}
