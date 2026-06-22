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
  onboarding: '/onboarding',
  services: '/services',
  packs: '/packs',

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
    services: {
      catalog: '/api/services/catalog',
      selection: '/api/services/selection',
      custom: '/api/services/custom',
    },
    packs: {
      list: '/api/packs',
      uploadImage: '/api/packs/upload-image',
    },
    onboarding: {
      complete: '/api/onboarding/complete',
    },
  },
} as const

/** Routes that require an authenticated session. */
export const PROTECTED_ROUTES: readonly string[] = [
  ROUTES.dashboard,
  ROUTES.settings,
  ROUTES.onboarding,
  ROUTES.services,
  ROUTES.packs,
]

/** Routes that should redirect to /dashboard when already authenticated. */
export const AUTH_ROUTES: readonly string[] = [
  ROUTES.login,
  ROUTES.register,
]
