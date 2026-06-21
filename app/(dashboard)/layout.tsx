import type { Metadata } from 'next'
import { AppSidebar } from '@/components/layout/AppSidebar'

export const metadata: Metadata = {
  title: 'Dashboard — Optivo',
  description: 'Manage your shoots, galleries, and clients.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  )
}
