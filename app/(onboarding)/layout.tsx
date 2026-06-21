import type { Metadata } from 'next'
import { getMessage } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Set up your studio — Optivo',
  description: 'Complete your studio setup to get started with Optivo.',
}

/**
 * Dedicated full-screen layout for the onboarding wizard.
 * No sidebar — keeps the user focused on the setup flow.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal header */}
      <header className="flex h-14 items-center border-b border-border px-6">
        <span className="text-base font-semibold tracking-tight text-foreground">
          Optivo
        </span>
      </header>

      {/* Wizard content fills remaining space */}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
