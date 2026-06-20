import type { Metadata } from 'next'
import { getMessage } from '@/lib/i18n'
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Create account — Optivo',
  description: 'Create your Optivo account to start managing your photography studio.',
}

export default function RegisterPage() {
  const locale = 'en'
  return (
    <main className="min-h-screen flex">
      <AuthBrandPanel />

      {/* Form side */}
      <section className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-28">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile wordmark */}
          <p className="mb-8 text-lg font-semibold tracking-tight text-foreground lg:hidden">
            Optivo
          </p>

          <header className="mb-8 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
              {getMessage(locale, 'auth.register.title')}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {getMessage(locale, 'auth.register.subtitle')}
            </p>
          </header>

          <RegisterForm />
        </div>
      </section>
    </main>
  )
}
