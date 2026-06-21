'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { validateEmail } from '@/modules/clients/validation'
import { getMessage } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'
import { InputField, FormError } from './FieldAtoms'
import { Button } from '@/components/ui/button'

export function LoginForm() {
  const router = useRouter()
  const locale = 'en'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const eErr = validateEmail(email, locale)
    const pErr = !password ? getMessage(locale, 'auth.validation.passwordRequired') : undefined
    setEmailError(eErr ?? undefined)
    setPasswordError(pErr)
    if (eErr || pErr) return

    setLoading(true)
    try {
      const res = await fetch('/api/clients/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setFormError(json.error ?? getMessage(locale, 'auth.login.invalidCredentials'))
        return
      }
      router.push(ROUTES.dashboard)
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
        label={getMessage(locale, 'auth.login.fieldErrors.email')}
        id="email"
        type="email"
        autoComplete="email"
        placeholder={getMessage(locale, 'auth.login.emailPlaceholder')}
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setEmailError(validateEmail(e.target.value, locale) ?? undefined)
        }}
        error={emailError}
        errorId="login-email-error"
      />

      {/* Password with toggle */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="text-sm font-medium text-foreground/80">
            {getMessage(locale, 'auth.login.fieldErrors.password')}<span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
          </label>
          {/* Placeholder for future forgot-password flow */}
          <span className="text-xs text-muted-foreground">{getMessage(locale, 'auth.login.forgotPassword')}</span>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={getMessage(locale, 'auth.login.passwordPlaceholder')}
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setPasswordError(e.target.value ? undefined : getMessage(locale, 'auth.validation.passwordRequired'))
            }}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'login-password-error' : undefined}
            className={[
              'w-full rounded-lg border bg-muted/40 px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground',
              'transition-colors outline-none',
              'focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/30',
              passwordError
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
        {passwordError && (
          <p id="login-password-error" role="alert" className="text-xs text-destructive mt-1">{passwordError}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 text-sm font-semibold rounded-lg bg-[var(--auth-accent)] text-[var(--auth-accent-foreground)] hover:opacity-90 transition-opacity border-0"
      >
        {loading ? getMessage(locale, 'auth.login.submitLoading') : getMessage(locale, 'auth.login.submitButton')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {getMessage(locale, 'auth.login.noAccount')}{' '}
        <Link href="/register" className="font-medium text-foreground hover:underline underline-offset-4 transition-colors">
          {getMessage(locale, 'auth.login.createLink')}
        </Link>
      </p>
    </form>
  )
}
