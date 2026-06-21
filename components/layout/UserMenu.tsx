'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { LogOut, Settings } from 'lucide-react'
import { getMessage } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'

interface UserMenuProps {
  name: string
  logoUrl: string | null
}

/**
 * Top-bar user widget.
 *
 * Renders the studio logo (if present, at its natural aspect ratio capped at
 * 160 × 48 px) alongside the studio name. Clicking opens a dropdown with
 * Settings and Log-out actions.
 */
export function UserMenu({ name, logoUrl }: UserMenuProps) {
  const locale = 'en'
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch(ROUTES.api.clients.logout, { method: 'POST' })
    } finally {
      router.push(ROUTES.login)
      router.refresh()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={getMessage(locale, 'nav.userMenuAriaLabel')}
        className="flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Logo or fallback initial */}
        {logoUrl ? (
          <span className="relative block h-8 overflow-hidden rounded">
            {/* Natural ratio: max-width 160px, height 32px */}
            <Image
              src={logoUrl}
              alt={getMessage(locale, 'nav.logoAlt', { name })}
              height={32}
              width={160}
              className="h-8 w-auto max-w-[160px] object-contain"
              unoptimized
            />
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-semibold select-none"
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}

        <span className="hidden sm:block text-sm font-medium text-foreground max-w-[160px] truncate">
          {name}
        </span>

        {/* Chevron */}
        <svg
          aria-hidden="true"
          className={`h-4 w-4 text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 z-50 min-w-[160px] origin-top-right rounded-lg border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <ul className="py-1">
            <li role="none">
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false)
                  router.push(ROUTES.settings)
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors rounded-md mx-0"
              >
                <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {getMessage(locale, 'nav.settings')}
              </button>
            </li>

            <li role="none" className="my-1 border-t border-border" aria-hidden="true" />

            <li role="none">
              <button
                role="menuitem"
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {getMessage(locale, 'nav.logout')}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
