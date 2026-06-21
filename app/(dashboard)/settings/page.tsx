import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings — Optivo',
}

/**
 * Settings page — placeholder.
 * Full implementation TBD.
 */
export default function SettingsPage() {
  return (
    <section className="mx-auto w-full max-w-screen-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
        Settings
      </h1>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Account and studio settings will be available here soon.
      </p>
    </section>
  )
}
