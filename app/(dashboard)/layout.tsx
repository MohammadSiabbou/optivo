import type { Metadata } from 'next'
import { AppHeader } from '@/components/layout/AppHeader'

export const metadata: Metadata = {
  title: 'Dashboard — Optivo',
  description: 'Manage your shoots, galleries, and clients.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
