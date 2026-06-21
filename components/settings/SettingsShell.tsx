'use client'

/**
 * Client-side shell for the Settings page.
 *
 * Renders the tab bar and the active tab's content. Currently only the
 * "Profile" tab exists, but the structure is ready for additional tabs.
 */
import { useState } from 'react'
import { getMessage } from '@/lib/i18n'
import { BasicInfoForm } from '@/components/settings/profile/BasicInfoForm'
import { SocialsForm } from '@/components/settings/profile/SocialsForm'
import { SecurityForm } from '@/components/settings/profile/SecurityForm'
import { cn } from '@/lib/utils'
import type { SafeClient } from '@/modules/clients/usecases/RegisterClientUseCase'

interface Tab {
  id: string
  labelKey: string
}

const TABS: Tab[] = [
  { id: 'profile', labelKey: 'settings.tabs.profile' },
]

interface Section {
  titleKey: string
  descriptionKey: string
  content: React.ReactNode
}

interface Props {
  client: SafeClient
  locale?: string
}

export function SettingsShell({ client, locale = 'en' }: Props) {
  const [activeTab, setActiveTab] = useState<string>('profile')

  const profileSections: Section[] = [
    {
      titleKey: 'settings.profile.basicInfo.title',
      descriptionKey: 'settings.profile.basicInfo.description',
      content: <BasicInfoForm client={client} locale={locale} />,
    },
    {
      titleKey: 'settings.profile.socials.title',
      descriptionKey: 'settings.profile.socials.description',
      content: <SocialsForm client={client} locale={locale} />,
    },
    {
      titleKey: 'settings.profile.security.title',
      descriptionKey: 'settings.profile.security.description',
      content: <SecurityForm locale={locale} />,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Tab bar */}
      <nav
        role="tablist"
        aria-label={getMessage(locale, 'settings.pageTitle')}
        className="flex border-b border-border"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-t-md',
              activeTab === tab.id
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                : 'text-muted-foreground hover:text-foreground/80',
            )}
          >
            {getMessage(locale, tab.labelKey)}
          </button>
        ))}
      </nav>

      {/* Profile tab panel */}
      {activeTab === 'profile' && (
        <div
          id="tabpanel-profile"
          role="tabpanel"
          aria-labelledby="tab-profile"
          className="flex flex-col gap-6"
        >
          {profileSections.map((section) => (
            <section
              key={section.titleKey}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-5">
                <h2 className="text-base font-semibold text-foreground text-balance">
                  {getMessage(locale, section.titleKey)}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {getMessage(locale, section.descriptionKey)}
                </p>
              </div>
              <div className="border-t border-border pt-5">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
