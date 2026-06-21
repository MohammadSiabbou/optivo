import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — Optivo',
}

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-screen-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Welcome to Optivo. Your shoots and galleries will appear here.
      </p>
    </section>
  )
}
