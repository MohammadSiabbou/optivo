/**
 * Centralised route map for Optivo.
 *
 * Import from here instead of writing path strings inline.
 * Add new routes as the app grows — one place to rename/move paths.
 */

export const ROUTES = {
  // ── Public ────────────────────────────────────────────────────────────────
  home: '/',
  login: '/login',
  register: '/register',

  // ── Authenticated ─────────────────────────────────────────────────────────
  dashboard: '/dashboard',
  settings: '/settings',

  // ── API ───────────────────────────────────────────────────────────────────
  api: {
    clients: {
      login: '/api/clients/login',
      register: '/api/clients/register',
      logout: '/api/clients/logout',
      uploadLogo: '/api/clients/upload-logo',
      updateProfile: '/api/clients/profile',
      updateSocials: '/api/clients/socials',
      changeSecurity: '/api/clients/security',
    },
  },
} as const

/** Routes that require an authenticated session. */
export const PROTECTED_ROUTES: readonly string[] = [
  ROUTES.dashboard,
  ROUTES.settings,
]

/** Routes that should redirect to /dashboard when already authenticated. */
export const AUTH_ROUTES: readonly string[] = [
  ROUTES.login,
  ROUTES.register,
]
