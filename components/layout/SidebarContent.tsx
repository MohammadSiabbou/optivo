'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Settings, LogOut, ChevronUp, Camera, Package } from 'lucide-react'
import { getMessage } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'

interface SidebarContentProps {
  name: string
  logoUrl: string | null
}

const locale = 'en'

const NAV_ITEMS = [
  {
    key: 'dashboard',
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
    labelKey: 'nav.dashboard',
  },
  {
    key: 'services',
    href: ROUTES.services,
    icon: Camera,
    labelKey: 'nav.services',
  },
  {
    key: 'packs',
    href: ROUTES.packs,
    icon: Package,
    labelKey: 'nav.packs',
  },
] as const

/**
 * SidebarContent — Client Component.
 *
 * Renders the vertical navigation links and the user identity block at the
 * bottom. The user block opens an upward popover with Settings and Log out.
 */
export function SidebarContent({ name, logoUrl }: SidebarContentProps) {
  const pathname = usePathname()
  const router = useRouter()

  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onEsc)
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
    <div className="flex h-full flex-col">
      {/* ── Nav links ─────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1" role="list">
          {NAV_ITEMS.map(({ key, href, icon: Icon, labelKey }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {getMessage(locale, labelKey)}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── User block ────────────────────────────────────────────────── */}
      <div
        ref={menuRef}
        className="relative border-t border-sidebar-border px-3 py-3"
      >
        {/* Upward popover */}
        {menuOpen && (
          <div
            role="menu"
            className="absolute bottom-full left-3 right-3 mb-1 z-50 origin-bottom-left rounded-lg border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
          >
            <ul className="py-1">
              <li role="none">
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    router.push(ROUTES.settings)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {getMessage(locale, 'nav.settings')}
                </button>
              </li>

              <li role="none" aria-hidden="true" className="my-1 border-t border-border" />

              <li role="none">
                <button
                  role="menuitem"
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {getMessage(locale, 'nav.logout')}
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={menuOpen}
          aria-label={getMessage(locale, 'nav.userMenuAriaLabel')}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          {/* Logo or initial avatar */}
          {logoUrl ? (
            <span className="relative flex h-8 shrink-0 items-center overflow-hidden rounded">
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold select-none"
            >
              {name.charAt(0).toUpperCase()}
            </span>
          )}

          {/* Studio name */}
          <span className="flex-1 truncate text-left text-sm font-medium text-sidebar-foreground">
            {name}
          </span>

          {/* Chevron — flips when open */}
          <ChevronUp
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${menuOpen ? '' : 'rotate-180'}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  )
}
