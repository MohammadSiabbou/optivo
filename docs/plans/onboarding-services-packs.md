# Plan — Onboarding Wizard, Services & Packs

> Status: **Plan only.** No application code is written yet. This document describes
> every file, class, function, and structural decision so implementation can follow
> the existing Optivo OOP conventions (`modules/ → validation, usecases, services,
> repositories`, ports-first, no hardcoded strings, no code duplication).

---

## 1. Feature summary

On a studio's first authenticated visit they are taken through a **setup wizard** that
captures what they offer and (optionally) their packs. Every wizard step is also a
standalone, freely-editable screen later. The three logical steps are:

1. **Photo services** — pick from default photo services + add custom ones.
2. **Video services** — only shown if the studio offers video; identical UI/logic to
   step 1 but for the `video` category (shared code, not duplicated).
3. **Packs** — optionally create packs (primary image + up to 10 images, name, price,
   optional old price, and a free-form list of feature lines).

A service definition is `{ icon, name (i18n key or custom label), category }`. Defaults
are seeded in the DB and shared across all studios; studios can also create their own
custom definitions. A separate selection table records which definitions each studio
actually offers.

---

## 2. Confirmed architectural decisions

These were confirmed with the user:

| Topic | Decision |
| --- | --- |
| Service storage | **One table + selection table** — `service_definitions` (defaults + custom) and `client_services` (which a studio offers). |
| Onboarding flag | **`onboarding_completed_at TIMESTAMP NULL`** column on `clients`. |
| Editable screens | **Dedicated routes** — `/onboarding` (wizard) plus standalone `/services` and `/packs`, all reusing the same step components. |
| Pack storage | **Blob + JSONB arrays** — images on Vercel Blob; `image_urls` + `features` stored as JSONB/array columns on a single `packs` table. |

> Open items still to confirm are collected in **Section 13**. Per project rules, do not
> resolve them unilaterally during implementation — ask first.

---

## 3. Data model

### 3.1 New tables / columns

**`clients` (alter)**
- Add `onboarding_completed_at TIMESTAMPTZ NULL`.
- `NULL` ⇒ studio still needs the wizard; a timestamp ⇒ onboarded.

**`service_definitions`** — shared catalog of selectable services (defaults + custom).
- `id UUID PK` (default `gen_random_uuid()`).
- `client_id UUID NULL` — `NULL` for system defaults; set (FK → `clients.id`, `ON DELETE CASCADE`) for a studio's custom definition.
- `category TEXT NOT NULL` — `'photo'` or `'video'` (kept as TEXT + app-level enum; see §13).
- `icon TEXT NOT NULL` — Lucide icon name (e.g. `"Camera"`). Custom rows get a sensible default icon when none is chosen.
- `name_key TEXT NULL` — i18n key for default rows (e.g. `services.catalog.outdoorPhotography`).
- `custom_label TEXT NULL` — raw label for custom rows. Exactly one of `name_key` / `custom_label` is set (enforced in app layer; optional CHECK constraint — see §13).
- `created_at`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- Index on `(category)` for default lookups and `(client_id)` for per-studio custom lookups.

**`client_services`** — which definitions a studio offers (the selection / join table).
- `id UUID PK`.
- `client_id UUID NOT NULL` (FK → `clients.id`, `ON DELETE CASCADE`).
- `service_definition_id UUID NOT NULL` (FK → `service_definitions.id`, `ON DELETE CASCADE`).
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- `UNIQUE (client_id, service_definition_id)` to prevent duplicate selections.

**`packs`** — one row per pack.
- `id UUID PK`.
- `client_id UUID NOT NULL` (FK → `clients.id`, `ON DELETE CASCADE`).
- `name TEXT NOT NULL`.
- `price NUMERIC(10,2) NOT NULL`.
- `old_price NUMERIC(10,2) NULL` (optional strike-through price).
- `primary_image_url TEXT NULL`.
- `image_urls JSONB NOT NULL DEFAULT '[]'` — array of secondary image URLs (max 10 total incl. primary, enforced in app layer).
- `features JSONB NOT NULL DEFAULT '[]'` — array of strings, one per feature line.
- `sort_order INT NOT NULL DEFAULT 0` — display ordering.
- `created_at`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- Index on `(client_id)`.

### 3.2 Kysely schema types — `lib/db/schema.ts`

Add interfaces mirroring the tables and register them in the `Database` interface:

- `ServiceDefinitionRow { id, client_id: string | null, category: string, icon, name_key: string | null, custom_label: string | null, created_at, updated_at }`
- `ClientServiceRow { id, client_id, service_definition_id, created_at }`
- `PackRow { id, client_id, name, price: string, old_price: string | null, primary_image_url: string | null, image_urls: string[], features: string[], sort_order: number, created_at, updated_at }`
  - Note: `pg` returns `NUMERIC` as `string`; keep DB type `string` and convert to number in the use-case/DTO layer.
- Add `onboarding_completed_at: Date | null` to `ClientRow`.
- Extend `Database` with `service_definitions`, `client_services`, `packs`.

### 3.3 Migrations

Migrations are plain `.js` files in `lib/db/migrations/` with `up`/`down` exports and
**must be registered in `lib/db/umzug.ts`'s `MIGRATIONS` array** (static import + entry).
Follow the exact style of `002_add_social_columns.js` (idempotent `IF EXISTS` / `IF NOT EXISTS`).

- **`003_add_onboarding_completed_at.js`** — `ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ`.
- **`004_create_service_tables.js`** — create `service_definitions` and `client_services` with FKs, unique constraint, and indexes.
- **`005_create_packs_table.js`** — create `packs`.
- **`006_seed_default_services.js`** — insert default `service_definitions` rows (`client_id = NULL`). Use `INSERT ... ON CONFLICT DO NOTHING`; give defaults stable IDs or a unique key on `(name_key)` where `client_id IS NULL` so re-running is safe (see §13 for the dedupe-key decision).

Each new file must be imported and appended to `MIGRATIONS` in `lib/db/umzug.ts`.
Migrations run via the existing `POST /api/internal/migrate` endpoint (secret-protected).

### 3.4 Default service catalog (seed content)

System defaults (`client_id = NULL`). Each has an `icon` (Lucide name), `name_key`, and `category`.
Proposed starter set (final list to confirm — §13):

**Photo (`category = 'photo'`)**
- Outdoor / on-location photography — `Sun`
- Studio photography — `Camera`
- Portrait photography — `User`
- Event photography — `PartyPopper`
- Wedding photography — `HeartHandshake`
- Product photography — `Package`
- Real-estate / architecture — `Building2`
- Aerial / drone photography — `Plane`
- Newborn / family — `Baby`
- Fashion / editorial — `Shirt`

**Video (`category = 'video'`)**
- Cinematic films — `Clapperboard`
- Slow-motion video — `Gauge`
- Event videography — `Video`
- Wedding films — `HeartHandshake`
- Drone / aerial video — `Plane`
- Promotional / commercial — `Megaphone`
- Music videos — `Music`
- Reels / short-form social — `Smartphone`

The i18n labels for these keys live under `services.catalog.*` in `en.json` (§7).

---

## 4. Backend module — `modules/services/`

Mirrors the structure of `modules/clients/`.

### 4.1 `modules/services/validation/index.ts`
Shared, locale-aware validators using `getMessage` (no hardcoded strings):
- `validateCustomServiceLabel(label, locale)` — required, trimmed length 2–80.
- `validateCategory(category, locale)` — must be `'photo' | 'video'`.
- `validateServiceSelection(payload, locale)` — shape of the "save selections" request:
  payload `{ category, definitionIds: string[], customServices: { label, icon? }[] }`.
  Returns `FieldErrors`-style object consistent with existing validation patterns.
- Export TS payload interfaces: `SaveServiceSelectionPayload`, `CustomServiceInput`.
- Export an `app-level` `SERVICE_CATEGORIES = ['photo','video'] as const` + `ServiceCategory` type.

### 4.2 `modules/services/repositories/`
- **`IServiceRepository.ts`** (port) — methods:
  - `listDefaults(category?): Promise<ServiceDefinitionRow[]>` — `client_id IS NULL`.
  - `listCustomForClient(clientId, category?): Promise<ServiceDefinitionRow[]>`.
  - `createCustomDefinition(clientId, data): Promise<ServiceDefinitionRow>`.
  - `listSelectedForClient(clientId, category?): Promise<ServiceDefinitionRow[]>` — join `client_services` → `service_definitions`.
  - `setSelections(clientId, category, definitionIds: string[]): Promise<void>` — replace the client's selections **for that category** (delete-then-insert in one logical operation; uses `db.kysely` transaction via `execute`).
  - `deleteCustomDefinition(clientId, definitionId): Promise<void>` — scoped to `client_id` so a studio can't delete defaults or others' rows.
- **`ServiceRepository.ts`** (impl) — `implements IServiceRepository`, constructor takes `IDBClient<Database>`. Uses `db.find/list/insert/delete` for simple ops and `db.kysely` + `db.execute` for the join + transactional `setSelections`. All queries scoped by `client_id` (no RLS — per-query scoping, matching project security note).

### 4.3 `modules/services/usecases/`
Each use case validates then delegates to the repo, returning DTOs (never raw rows with internal-only fields):
- **`GetServiceCatalogUseCase`** — returns `{ defaults, custom, selectedIds }` for a given client + optional category. Used to hydrate the step UI.
- **`SaveServiceSelectionUseCase`** — input `(clientId, SaveServiceSelectionPayload)`:
  1. validate;
  2. create any new custom definitions (returns their ids);
  3. call `repo.setSelections(clientId, category, [...definitionIds, ...newCustomIds])`.
  - Returns the refreshed selection DTO.
- **`AddCustomServiceUseCase`** — create a single custom definition (used by the "add your own" inline action when not done as part of bulk save).
- **`DeleteCustomServiceUseCase`** — remove a studio's custom definition.

DTO note: define a `ServiceDefinitionDTO` that resolves the display name on the server
where possible, or returns `{ id, icon, nameKey, customLabel, category, isCustom }` and
lets the client resolve `nameKey` via `getMessage`. Prefer the latter to keep i18n on the
client, consistent with current components.

### 4.4 `modules/services/factory.ts`
`buildServiceDeps()` mirroring `modules/clients/factory.ts`: instantiate `DBClient`,
`ServiceRepository`, and return the four use cases. Called once per request in route handlers.

---

## 5. Backend module — `modules/packs/`

### 5.1 `modules/packs/validation/index.ts`
- Constants: `PACK_MAX_IMAGES = 10`, `PACK_IMAGE_MAX_BYTES = 5 * 1024 * 1024` (reuse the logo limit value; consider hoisting a shared constant — §13).
- `validatePackName(name, locale)` — required, 2–120.
- `validatePrice(value, locale)` — required, numeric, ≥ 0.
- `validateOldPrice(value, price, locale)` — optional; if present must be numeric ≥ 0 and (recommended) greater than `price`.
- `validateFeatures(lines: string[], locale)` — trims, drops empty lines; each ≤ 120 chars; cap total count (e.g. 30 — confirm §13).
- `validateImages(primaryUrl, imageUrls, locale)` — total images ≤ `PACK_MAX_IMAGES`; primary required if any images exist (confirm whether primary is mandatory — §13).
- `validateCreatePack` / `validateUpdatePack` aggregates → `FieldErrors<...>`.
- Export `CreatePackPayload`, `UpdatePackPayload` interfaces.

### 5.2 `modules/packs/repositories/`
- **`IPackRepository.ts`** — `listForClient(clientId)`, `findById(id)`, `create(clientId, data)`, `update(clientId, id, data)`, `delete(clientId, id)`, `reorder(clientId, orderedIds[])`. All scoped by `client_id`.
- **`PackRepository.ts`** — `implements IPackRepository` over `IDBClient<Database>`. JSONB columns (`image_urls`, `features`) passed as JS arrays; convert `price`/`old_price` between number (DTO) and string (DB) at this boundary or in the use case.

### 5.3 `modules/packs/usecases/`
- **`ListPacksUseCase`** — returns `PackDTO[]` (price/oldPrice as numbers).
- **`CreatePackUseCase`** — validate → `repo.create`.
- **`UpdatePackUseCase`** — validate → `repo.update` (ownership enforced by `client_id` filter).
- **`DeletePackUseCase`** — `repo.delete`.
- `PackDTO` shape: `{ id, name, price, oldPrice, primaryImageUrl, imageUrls, features, sortOrder }`.

### 5.4 `modules/packs/factory.ts`
`buildPackDeps()` → `DBClient`, `PackRepository`, the four pack use cases.

---

## 6. API routes (App Router route handlers)

All follow the existing pattern: read `optivo_token` cookie via `next/headers`,
`verifyToken`, 401 on missing/invalid, build deps via factory, map validation errors to
**422** and others to **500** (same convention as `app/api/clients/profile/route.ts`).
Add all paths to `ROUTES.api` in `lib/routes.ts`.

### 6.1 Services
- **`app/api/services/catalog/route.ts`** — `GET` (optional `?category=`) → `GetServiceCatalogUseCase`. Returns `{ defaults, custom, selectedIds }`.
- **`app/api/services/selection/route.ts`** — `PUT` body `{ category, definitionIds, customServices }` → `SaveServiceSelectionUseCase`.
- **`app/api/services/custom/route.ts`** — `POST` (add one custom) and `DELETE` (`?id=`) → `AddCustomServiceUseCase` / `DeleteCustomServiceUseCase`.

### 6.2 Packs
- **`app/api/packs/route.ts`** — `GET` (list) + `POST` (create).
- **`app/api/packs/[id]/route.ts`** — `PATCH` (update) + `DELETE`. Await `params` (Next 16 async params).
- **Pack image upload** — reuse the existing upload pattern. Either:
  - generalise `app/api/clients/upload-logo/route.ts` into a shared `app/api/uploads/route.ts` that accepts a `folder` field (`logos` | `packs`), **or**
  - add `app/api/packs/upload-image/route.ts` mirroring `upload-logo`.
  - Decision in §13. Whichever is chosen, keep a single shared upload helper to avoid duplication (project rule: never repeat code).

### 6.3 Onboarding completion
- **`app/api/onboarding/complete/route.ts`** — `POST` → sets `clients.onboarding_completed_at = now()` via a new `CompleteOnboardingUseCase` in `modules/clients/usecases/` (uses existing `ClientRepository.update`, which already accepts partial `clients` columns). Add it to `modules/clients/factory.ts`.

---

## 7. i18n — `lib/i18n/messages/en.json`

All user-visible strings go here (project rule: no hardcoded text). New namespaces:

- **`onboarding`**: `pageTitle`, `welcome`, `subtitle`, step labels (`steps.photo`, `steps.video`, `steps.packs`), nav buttons (`next`, `back`, `skip`, `finish`, `saving`), progress label, completion toast.
- **`services`**:
  - `photo.title/description`, `video.title/description`.
  - `offerQuestion` ("What do you offer?") with `photoOption` / `videoOption` toggles for the first screen branching.
  - `addCustom`, `customLabelPlaceholder`, `customLabelAria`, `removeCustomAria`, `emptyState`, `saveButton`, `savedSuccess`.
  - `catalog.*` — one key per default service (e.g. `catalog.outdoorPhotography`, `catalog.slowMotionVideo`, …) matching the `name_key`s seeded in migration `006`.
  - `validation.*` — `categoryInvalid`, `customLabelRequired`, `customLabelLength`, `selectAtLeastOne` (if required — §13).
- **`packs`**:
  - `title/description`, `addPack`, `editPack`, `deletePack`, `nameLabel`, `priceLabel`, `oldPriceLabel`, `oldPriceHint` (optional), `featuresLabel`, `featureLinePlaceholder`, `addFeatureLine`, `removeFeatureLineAria`, `primaryImageLabel`, `galleryLabel`, `imageCountHint` ("Up to 10 images"), `setPrimaryAria`, `saveButton`, `saving`, `savedSuccess`, `emptyState`.
  - `validation.*` — `nameRequired`, `priceRequired`, `priceInvalid`, `oldPriceInvalid`, `tooManyImages`, `featureTooLong`, etc.

Keep keys nested and consistent with the existing `settings.*` style. Every `getMessage`
call in new components must resolve to a key added here.

---

## 8. Routing & onboarding gate

### 8.1 `lib/routes.ts`
Add to `ROUTES`:
- `onboarding: '/onboarding'`
- `services: '/services'`
- `packs: '/packs'`
- under `api`: `services: { catalog, selection, custom }`, `packs: { list: '/api/packs', upload: ... }`, `onboarding: { complete: '/api/onboarding/complete' }`.

Add `/services`, `/packs`, `/onboarding` to `PROTECTED_ROUTES`.

### 8.2 Redirect logic (gate to the wizard)
`middleware.ts` only verifies the JWT (no DB access in middleware — keep it that way to
avoid DB calls at the edge). The onboarding gate is enforced in the **dashboard layout**
(`app/(dashboard)/layout.tsx`), which is already a Server Component reading the cookie:

- In the dashboard layout (or a small shared `requireClient()` server helper), fetch the
  client row (it already needs the client for the sidebar). If `onboarding_completed_at`
  is `NULL` **and** the current path is not `/onboarding`, `redirect(ROUTES.onboarding)`.
- Conversely, the `/onboarding` page itself should `redirect(ROUTES.dashboard)` if the
  studio is already onboarded (so they use `/services` & `/packs` to edit instead).
- Confirm whether `/onboarding` lives inside the `(dashboard)` group (gets sidebar) or is
  its own full-screen route group `(onboarding)` without the sidebar (§13). Recommended:
  a dedicated full-screen layout for a focused wizard experience.

---

## 9. Frontend — shared step components (no duplication)

The wizard and the standalone `/services` & `/packs` pages render the **same** step
components. Structure under `components/onboarding/` and `components/services/` /
`components/packs/`:

### 9.1 Shared service-step component
- **`components/services/ServiceCategoryStep.tsx`** (Client Component) — the reusable
  "select services for a category" screen. Props:
  `{ category: 'photo' | 'video', defaults, custom, selectedIds, locale, onSaved? }`.
  - Renders a responsive grid of selectable **service cards** (icon + i18n/custom label,
    toggle selected state). Uses Lucide icons resolved from the `icon` string via a small
    `iconMap` helper (`components/services/iconMap.ts`) — do **not** render arbitrary
    dynamic imports; map known names to imported icons, with a fallback icon.
  - "Add your own" affordance: an input row that appends a custom service (local state),
    shown as a card with a remove button.
  - Persists via `PUT /api/services/selection`. Because the same component is used in the
    wizard (where saving is part of "Next") and on the standalone page (where it has its
    own Save button), expose behaviour through props: `mode: 'wizard' | 'standalone'` or
    an injected `onSubmit`/`onSaved` callback so the parent controls navigation.
- **`components/services/OfferTypeStep.tsx`** — the very first screen: choose
  Photo and/or Video (both allowed). Drives whether the video step is shown. State is held
  by the wizard container; on the standalone pages this maps to which categories are
  visible.
- **`components/services/ServiceCard.tsx`** — presentational card (icon, label, selected
  ring), reused by `ServiceCategoryStep`.

### 9.2 Shared pack component
- **`components/packs/PackForm.tsx`** (Client Component) — create/edit a single pack:
  name, price, old price (optional), feature lines (dynamic list of inputs — "each line is
  an input", add/remove rows), image manager (primary + up to 10, upload via the shared
  upload endpoint, set-primary, remove). Reuses upload UX from the existing logo uploader —
  extract the drag/drop uploader from `components/.../BasicInfoForm` into a shared
  `components/common/ImageUploader.tsx` if not already shared, to avoid duplication.
- **`components/packs/PackList.tsx`** — lists existing packs with edit/delete; used by the
  standalone `/packs` page and (read-only summary) optionally in the wizard's pack step.
- **`components/packs/PacksStep.tsx`** — wizard-friendly wrapper that lets the user add
  zero or more packs then continue/finish.

### 9.3 Feature-line input
- **`components/packs/FeatureLinesInput.tsx`** — controlled list-of-strings editor: render
  one `<input>` per feature, Enter adds a new line, empty trailing line behaviour, remove
  buttons, accessible labels. Returns `string[]` to the parent. Shared by `PackForm`.

---

## 10. Frontend — pages & wizard container

### 10.1 Wizard — `app/(onboarding)/onboarding/page.tsx` (+ layout)
- Server Component: auth-guard (cookie → `verifyToken` → redirect if onboarded), then load
  initial data (service catalog for both categories, existing selections, existing packs)
  via the factories/use cases directly (server-side), and pass DTOs to a client
  **`OnboardingWizard`** container.
- **`components/onboarding/OnboardingWizard.tsx`** (Client Component) — owns wizard state:
  current step, selected offer types (photo/video), and orchestrates the shared step
  components in order: `OfferTypeStep → ServiceCategoryStep(photo) → ServiceCategoryStep(video, conditional) → PacksStep`.
  - Progress indicator / stepper (`components/onboarding/WizardStepper.tsx`).
  - Per-step persistence: each step saves to its API on "Next" so progress isn't lost.
  - Final "Finish" calls `POST /api/onboarding/complete` then `router.push(ROUTES.dashboard)`.
  - "Skip" on the packs step is allowed (packs optional) and still completes onboarding.
- A dedicated `app/(onboarding)/layout.tsx` gives the wizard a focused full-screen frame
  (logo + progress, no sidebar). Add `<html className="bg-background">` already handled by
  root layout.

### 10.2 Standalone editors (dedicated routes, reuse step components)
- **`app/(dashboard)/services/page.tsx`** — Server Component: auth-guard, load catalog +
  selections, render a `ServicesShell` (mirrors `SettingsShell`) that shows
  `ServiceCategoryStep` for photo and (if applicable) video in `mode="standalone"` with
  their own Save buttons. Lets the studio also toggle which offer types they provide.
- **`app/(dashboard)/packs/page.tsx`** — Server Component: auth-guard, load packs, render
  `PackList` + a `PackForm` (modal or inline) for create/edit. `mode="standalone"`.
- Add nav links to these from the sidebar (`components/layout/SidebarContent.tsx`) using
  `ROUTES.services` / `ROUTES.packs` and new `nav.*` i18n keys (`nav.services`, `nav.packs`).

The key reuse principle: **pages are thin servers that fetch + auth-guard; the actual
editing UI lives in shared step components** consumed by both the wizard and the standalone
pages. Behaviour differences are controlled by a `mode` prop / injected callbacks, never by
copy-pasting markup.

---

## 11. Security & conventions checklist

- Every services/packs query is **scoped by `client_id`** from the verified token (no RLS
  on Aurora — per-query scoping is mandatory).
- Custom-definition and pack mutations verify ownership via the `client_id` filter; deleting
  a default (`client_id IS NULL`) is rejected.
- All strings via `getMessage` / `en.json`; no inline literals in components.
- All paths via `ROUTES`; no hardcoded path strings.
- Ports defined before implementations (`I*Repository` first).
- Factories wire dependencies per request, mirroring `modules/clients/factory.ts`.
- Numeric prices: DB `NUMERIC` ↔ JS `number` conversion isolated to the repo/use-case
  boundary; DTOs expose numbers, DB layer uses strings.
- Reuse the existing Blob upload approach and the existing image-uploader UI; extract a
  shared uploader rather than duplicating.

---

## 12. Tests (vitest, mirror folder structure under `__tests__/`)

Add tests alongside existing ones (`modules/clients/__tests__/...` style):
- `modules/services/__tests__/validation/services.test.ts` — custom label, category, selection payload.
- `modules/services/__tests__/usecases/services.test.ts` — `SaveServiceSelection` (incl. creating custom + replacing selections), catalog hydration, delete-custom ownership scoping (use a fake `IServiceRepository`).
- `modules/packs/__tests__/validation/packs.test.ts` — name/price/old-price/features/images rules.
- `modules/packs/__tests__/usecases/packs.test.ts` — create/update/delete with ownership scoping (fake `IPackRepository`).
- `modules/clients/__tests__/usecases/onboarding.test.ts` — `CompleteOnboardingUseCase` sets timestamp.

Follow existing test conventions (fakes implementing the port interfaces, no real DB).

---

## 13. Open questions to confirm before/while implementing

Per project rule ("never make arch decisions alone"), confirm these:

1. **Category storage**: TEXT + app-level enum vs a Postgres `ENUM`/`CHECK` constraint for `service_definitions.category`?
2. **Exactly-one-name constraint**: enforce `name_key` XOR `custom_label` with a DB `CHECK`, or app-layer only?
3. **Default-seed dedupe key**: unique index on `(name_key) WHERE client_id IS NULL`, or fixed UUIDs in the seed migration?
4. **Selection requirement**: must a studio pick at least one photo service to finish onboarding, or can they complete with none?
5. **Primary image**: is a primary image required for a pack, or optional? Max still 10 total including primary?
6. **Feature line cap**: any maximum number of feature lines per pack (e.g. 30)?
7. **Upload endpoint**: generalise `upload-logo` into a shared `/api/uploads` (with folder param) vs add a separate `/api/packs/upload-image`?
8. **Wizard chrome**: dedicated `(onboarding)` full-screen layout (recommended) vs render inside the `(dashboard)` group with the sidebar?
9. **Default catalog list**: confirm/adjust the exact default photo & video services in §3.4.
10. **Locale**: everything is `'en'` today — keep hardcoding `'en'` at call sites as the current code does, or thread a real locale? (Stay consistent with current behaviour unless told otherwise.)

---

## 14. Implementation order (suggested)

1. DB: schema types + migrations `003`–`006` + register in `umzug.ts`; run migrate endpoint.
2. `modules/services` (validation → port → repo → use cases → factory) + tests.
3. `modules/packs` (same order) + tests; `CompleteOnboardingUseCase` in `modules/clients`.
4. API routes (services, packs, onboarding complete, upload) + `ROUTES` + i18n keys.
5. Shared step components (`ServiceCategoryStep`, `OfferTypeStep`, `ServiceCard`, `PackForm`, `FeatureLinesInput`, `PackList`, shared `ImageUploader`).
6. Wizard container + `(onboarding)` route/layout + dashboard-layout onboarding gate.
7. Standalone `/services` and `/packs` pages + sidebar nav links.
8. Browser verification of the full wizard flow and the standalone editors.
