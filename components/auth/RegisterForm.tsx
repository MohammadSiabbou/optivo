'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  type FieldErrors,
  type RegisterPayload,
} from '@/lib/validation/client'
import { getMessage } from '@/lib/i18n'
import { InputField, FormError } from './FieldAtoms'
import { LogoUploader } from './LogoUploader'
import { Button } from '@/components/ui/button'

export function RegisterForm() {
  const router = useRouter()
  const locale = 'en'

  const [fields, setFields] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors<RegisterPayload>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Reactive field-level validation
  const touch = (field: keyof RegisterPayload, value: string) => {
    setFields((f) => ({ ...f, [field]: value }))
    let err: string | null = null
    if (field === 'name') err = validateName(value, locale)
    if (field === 'email') err = validateEmail(value, locale)
    if (field === 'password') err = validatePassword(value, locale)
    if (field === 'confirmPassword') err = validatePasswordConfirm(fields.password, value, locale)
    setErrors((e) => ({ ...e, [field]: err ?? undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Full validation pass before sending
    const nameErr = validateName(fields.name, locale)
    const emailErr = validateEmail(fields.email, locale)
    const passwordErr = validatePassword(fields.password, locale)
    const confirmErr = validatePasswordConfirm(fields.password, fields.confirmPassword, locale)
    const allErrors = {
      name: nameErr ?? undefined,
      email: emailErr ?? undefined,
      password: passwordErr ?? undefined,
      confirmPassword: confirmErr ?? undefined,
    }
    setErrors(allErrors)
    if (nameErr || emailErr || passwordErr || confirmErr) return

    setLoading(true)
    try {
      const res = await fetch('/api/clients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, logo_url: logoUrl }),
      })
      const json = await res.json()
      if (!res.ok) {
        setFormError(json.error ?? getMessage(locale, 'auth.common.registrationFailed'))
        return
      }
      router.push('/dashboard')
    } catch {
      setFormError(getMessage(locale, 'auth.common.unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormError message={formError} />

      <InputField
        label={getMessage(locale, 'auth.register.fieldErrors.name')}
        id="name"
        type="text"
        autoComplete="organization"
        placeholder={getMessage(locale, 'auth.register.namePlaceholder')}
        required
        value={fields.name}
        onChange={(e) => touch('name', e.target.value)}
        error={errors.name}
        errorId="name-error"
      />

      <InputField
        label={getMessage(locale, 'auth.register.fieldErrors.email')}
        id="email"
        type="email"
        autoComplete="email"
        placeholder={getMessage(locale, 'auth.register.emailPlaceholder')}
        required
        value={fields.email}
        onChange={(e) => touch('email', e.target.value)}
        error={errors.email}
        errorId="email-error"
      />

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-foreground/80">
          {getMessage(locale, 'auth.register.fieldErrors.password')}<span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={getMessage(locale, 'auth.register.passwordPlaceholder')}
            required
            value={fields.password}
            onChange={(e) => touch('password', e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={[
              'w-full rounded-lg border bg-muted/40 px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground',
              'transition-colors outline-none',
              'focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/30',
              errors.password
                ? 'border-destructive focus:border-destructive focus:ring-destructive/25'
                : 'border-border',
            ].join(' ')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? getMessage(locale, 'auth.common.hidePassword') : getMessage(locale, 'auth.common.showPassword')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" role="alert" className="text-xs text-destructive mt-1">{errors.password}</p>
        )}
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground/80">
          {getMessage(locale, 'auth.register.fieldErrors.confirmPassword')}<span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={getMessage(locale, 'auth.register.confirmPlaceholder')}
            required
            value={fields.confirmPassword}
            onChange={(e) => touch('confirmPassword', e.target.value)}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
            className={[
              'w-full rounded-lg border bg-muted/40 px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground',
              'transition-colors outline-none',
              'focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/30',
              errors.confirmPassword
                ? 'border-destructive focus:border-destructive focus:ring-destructive/25'
                : 'border-border',
            ].join(' ')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? getMessage(locale, 'auth.common.hidePasswordConfirm') : getMessage(locale, 'auth.common.showPasswordConfirm')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="confirm-error" role="alert" className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      <LogoUploader locale={locale} />

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 text-sm font-semibold rounded-lg bg-[var(--auth-accent)] text-[var(--auth-accent-foreground)] hover:opacity-90 transition-opacity border-0"
      >
        {loading ? getMessage(locale, 'auth.register.submitLoading') : getMessage(locale, 'auth.register.submitButton')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {getMessage(locale, 'auth.register.alreadyHaveAccount')}{' '}
        <Link href="/login" className="font-medium text-foreground hover:underline underline-offset-4 transition-colors">
          {getMessage(locale, 'auth.register.signInLink')}
        </Link>
      </p>
    </form>
  )
}
