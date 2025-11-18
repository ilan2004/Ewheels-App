# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development commands

### Install & run
- Install dependencies (from repo root):
  - `npm install`
- Start Expo dev server (Metro bundler, QR code, etc.):
  - `npm run start`
  - Or with cache cleared (useful after env/schema changes): `npx expo start --clear`
- Run on specific platforms:
  - Android: `npm run android`
  - iOS: `npm run ios`
  - Web: `npm run web`
- Lint TypeScript/JS:
  - `npm run lint`
- Reset Expo starter code back to a blank `app/` directory (destructive to current screens):
  - `npm run reset-project`

### Supabase connectivity & schema helpers
- Quick connectivity & table existence check (uses `.env.local`):
  - `node test-supabase.js`
- Inspect actual table shapes for `service_tickets` and `customers`:
  - `node check-schema.js`
- Probe which customer/ticket column combinations exist in the current DB (useful when aligning types to a live project):
  - `node check-customers.js`
- Status updates DB setup (ticket status timeline feature): see `STATUS_UPDATES_DB_SETUP.md` for full instructions; typical flow is:
  - Using Supabase CLI: run `supabase start` then `supabase db push` in the parent Supabase project that owns this app’s migrations.
  - Or run the SQL in `supabase/create_status_updates_table.sql` manually via the Supabase SQL editor.

### Tests
- There is currently **no configured automated test runner** in `package.json` (no `test` script, Jest/Vitest dependency, or test files), so there is no canonical command to run a single test.

## Environment & runtime modes

### Supabase configuration
- The Supabase client is centralized in `lib/supabase.ts` and **throws at module load time** if URL or anon key are missing/invalid.
- Environment variable resolution order (first non-empty wins):
  - URL: `EXPO_PUBLIC_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL` → `SUPABASE_URL`
  - Anon key: `EXPO_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `SUPABASE_ANON_KEY`
- For Expo, preferred configuration is via `.env.local` using the `EXPO_PUBLIC_…` names, for example:
  - `EXPO_PUBLIC_SUPABASE_URL=...`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY=...`
- The client uses:
  - `window.localStorage` for web
  - `expo-secure-store` for native auth storage

### Mock vs real API
- Several services (e.g. `services/jobCardsService.ts`, `services/floorManagerService.ts`, `services/dataService.ts`, `stores/authStore.ts`) have an internal `isMockMode()` check.
- Mock mode is enabled when **either**:
  - `EXPO_PUBLIC_USE_MOCK_API === 'true'` **or** `USE_MOCK_API === 'true'`,
  - or required Supabase env vars are missing.
- In mock mode these services:
  - Generate realistic job-card, KPI, and team workload data in memory.
  - Use email patterns like `floormanager@evwheels.com`, `manager@…`, `tech@…` in `authStore` to synthesize users with appropriate roles.
- To connect to a real Supabase project, ensure the Supabase env vars are set and `EXPO_PUBLIC_USE_MOCK_API` is not set to `'true'`.

### Location scoping
- `stores/locationStore.ts` manages the *active location* and the list of locations available to the current user.
- The `DataService` (`services/dataService.ts`) applies location scoping to key tables (`service_tickets`, `customers`, `battery_records`, `quotes`, `invoices`, etc.) via `location_id`, unless the user’s role can bypass location filtering.
- Bypass logic (see `lib/permissions.ts`): admins and front-desk managers see all locations; floor managers and technicians are scoped to their assigned location.

### Backend/database setup
- High-level database setup for the broader EvWheels system is documented in `database/README.md`:
  - Run `setup-schema.sql` in Supabase to create the core schema (locations, profiles, app_roles, customers, vehicles, service_tickets, etc.).
  - Optionally run `sample-data.sql` after replacing `auth.uid()` with a real Supabase user id.
  - Then restart the Expo dev server with `npx expo start --clear` and log in using the newly created user.
- Additional notes and fixes:
  - `FLOOR_MANAGER_FIXES.md` documents how to add the missing foreign key between `app_roles.user_id` and `profiles.user_id`, and how to configure `EXPO_PUBLIC_API_URL` when hitting a separate API server.
  - `STATUS_UPDATES_DB_SETUP.md` covers the `ticket_status_updates` table and related RLS/indexes.

## App architecture overview

### Navigation & role-specific layouts
- The app uses **Expo Router** with file-based routing under `app/`.
- Two main route groups:
  - `app/(auth)/…`: authentication flow, including `login.tsx` and its own stack layout.
  - `app/(tabs)/…`: post-login main application, rendered via `app/(tabs)/_layout.tsx`.
- `app/(tabs)/_layout.tsx` builds **different tab bars per role**, using `useAuthStore()`:
  - **Technician**: two tabs (`technician-jobcards`, `technician-profile`).
  - **Floor manager**: `dashboard`, `jobcards`, `team`, `profile`.
  - **Front-desk manager/manager**: `front-desk-dashboard`, `invoices`, `media-hub`, `front-desk-profile`.
  - **Admin**: `dashboard`, `jobcards`, `team`, `notifications`, `profile`.
- Many routes (e.g. `camera`, `media-library`, some dashboards) are registered but hidden from the tab bar via `options={{ href: null }}`; they remain navigable by deep links/router calls.

### State management & data layer
- **Authentication & user profile**:
  - `stores/authStore.ts` (Zustand) owns `user`, `loading`, and `initialized` flags.
  - `signIn` uses Supabase password auth, then queries `profiles` and `app_roles` to derive a `UserRole`; if those tables or joins fail, it falls back to a default admin profile.
  - `checkAuthState` runs on app startup and in response to Supabase auth events to hydrate the store.
- **Location state**:
  - `stores/locationStore.ts` tracks `activeLocation` and `availableLocations` per user.
  - It reads from `user_locations` (join to `locations`) when available; otherwise it falls back to all locations, or a synthetic "Default Location" if the tables are missing.
  - The active location is persisted in `AsyncStorage`.
- **Media hub state**:
  - `stores/mediaHubStore.ts` is a dedicated store for `media_items` and related filters/selection, with integration to Supabase tables and Supabase Storage (`media-items` bucket).
  - Provides higher-level operations like `assignToTicket`, `uploadToSupabase`, and derived selectors such as `getFilteredItems()` and `getItemsByTicket()`.
- **Domain services (Supabase + mock mode)**:
  - `services/dataService.ts` – cross-cutting dashboard data with location scoping:
    - `getDashboardKPIs(role, activeLocationId)` computes open/due/overdue/SLA-risk metrics across `service_tickets` and `battery_records`.
    - `getRecentTickets` and `getTeamWorkload` (further down the file) encapsulate tickets/team queries with the same scoping rules.
  - `services/jobCardsService.ts` – job card-focused service layer:
    - Provides dashboard KPIs, ticket listing with filters and pagination, recent ticket queries, per-ticket fetch (`getTicketById`), technician workload, and triage/status update operations.
    - Contains a detailed mock ticket generator with realistic Indian names, registrations, and randomised dates, used whenever Supabase is unavailable or mock mode is enabled.
  - `services/floorManagerService.ts` – floor-manager-specific dashboard & technician overview:
    - Exposes `getDashboardStats` for unassigned/in-progress/due-today/overdue counts.
    - Exposes technician overviews with per-technician ticket lists (mocked in dev).
  - `services/customerService.ts` – customer search and CRUD:
    - `searchCustomers` supports combined name/phone/email search plus optional `location_id` filter.
    - `createCustomer`/`updateCustomer` automatically stamp `created_by`/`updated_by` from the current Supabase user.
  - `services/invoiceService.ts` – invoice creation, listing, and payments:
    - Uses `lib/invoiceCalculations.ts` to compute line-level and aggregate invoice totals.
    - Persists invoices and `invoice_items`, and exposes helpers like `generateInvoiceNumber` and `updateInvoiceStatus`.

### Types & domain modelling
- Core types live in `types/`:
  - `types/index.ts` defines:
    - `UserRole`, `ServiceTicketStatus`, `Priority`.
    - `ServiceTicket` (mirroring the web app’s schema) including triage metadata, location info, and linked case ids.
    - Dashboard and workload types (`DashboardKPIs`, `TechnicianWorkload`), generic API/ pagination shapes, ticket filter and form types.
  - `types/customer.ts` and `types/invoice.ts` define customer, invoice, and payment-related shapes plus various DTOs used by the services and UI.
- Customer ↔ invoice mapping helpers in `lib/customerMapping.ts`:
  - Provide mapping from `Customer` to invoice-ready `InvoiceCustomerData`, search-key construction, filtering/sorting helpers, and convenience formatting for addresses and display names.
- Invoice calculation helpers in `lib/invoiceCalculations.ts`:
  - Implement line item math, aggregate totals, validation helpers, and creation/updating of invoice items.

### Permissions & role-based UI
- `lib/permissions.ts` centralizes **mobile role permissions** and navigation access:
  - `Permission` enum enumerates fine-grained rights (ticket management, batteries, customers, analytics, users, locations, attachments).
  - `MOBILE_ROLE_PERMISSIONS` maps `UserRole` → list of permissions.
  - Utility functions:
    - `hasPermission` / `hasAnyPermission` / `hasAllPermissions`.
    - `getFeatureAccess(userRole)` – returns a shape of booleans used by UI/components to conditionally render actions.
    - `getAccessibleNavigation` – determines which navigation sections are visible for a role.
    - `canBypassLocationFilter` – used by `DataService` and other code to decide whether to apply `location_id` scoping.
- Many screens (e.g. `app/(tabs)/dashboard.tsx`) compute `featureAccess` from the current user role and use it to decide whether to fetch certain data (team workload, analytics) or show certain UI blocks.

### Screens & major feature flows

#### Dashboards & overview
- `app/(tabs)/dashboard.tsx` is the main **manager dashboard**:
  - Uses React Query to fetch KPIs (`dataService.getDashboardKPIs`), recent tickets, and team workload, keyed by `user.role` and `activeLocation.id`.
  - Renders KPI cards that deep-link into filtered job card lists via Expo Router query params.
  - For floor managers, it delegates entirely to `FloorManagerDashboard` (in the same folder) for a tailored view.
  - Integrates location selection via `LocationSelector` (component) tied to `useLocationStore()`.

#### Job cards (manager view)
- `app/(tabs)/jobcards.tsx` shows a **filterable list of service tickets** for managers/floor managers:
  - Uses React Query + `jobCardsService.getTickets` under the hood.
  - Local `TicketFilters` state is exposed via a `FilterModal` (status, priority, assigned/unassigned), plus search inputs and badges.
  - Each `JobCardItem` shows ticket number, complaint, customer, vehicle, status/priority, and assignment summary, and routes to `app/jobcards/[ticketId].tsx` for details.

#### Job cards (technician view)
- `app/(tabs)/technician-jobcards.tsx` is the technician-specific job list:
  - Similar structure to the manager jobcards screen but with **technician-focused filters** and a quick-action to advance status (e.g. `assigned → in_progress → completed`) with confirmation via `Alert`.
  - Uses `jobCardsService` to fetch only tickets assigned to the current technician.

#### Job card detail, triage, and status updates
- `app/jobcards/[ticketId].tsx` is the **job card detail page**:
  - Fetches a single ticket via `jobCardsService.getTicketById` and shows full job information, assignment, and key dates.
  - Integrates:
    - `components/triage/TriageManagement.tsx` – floor-manager triage flow (migrated from the web app; see `TRIAGE_MIGRATION_SUMMARY.md`).
    - `components/status/StatusUpdatesTimeline.tsx` – read-only, chronological view of status updates grouped by job-card status.
    - `components/status/StatusUpdateInput.tsx` – modal for adding new status updates, including status-specific quick templates.
  - Assignment UI uses a `TechnicianPickerModal` that pulls available technicians via `jobCardsService.getTechnicians`, allows selecting/unassigning, and optionally sets a due date.
- The **status update feature** is further specified in `CUSTOM_STATUS_UPDATES_FEATURE.md` and wired to the `ticket_status_updates` table described in `STATUS_UPDATES_DB_SETUP.md`.

#### Media hub
- The media hub is a first-class feature for front-desk managers and others:
  - `stores/mediaHubStore.ts` holds the core state, including `MediaItem` records, ticket associations, filters, and selection.
  - UI lives under `components/media-hub/` (`CaptureSection`, `AudioSection`, `LibrarySection`, `JobCardSelector`, `MediaItem`, etc.) and the `app/(tabs)/media-hub.tsx` route.
  - `uploadToSupabase` pushes media to a Supabase Storage bucket, then writes metadata into the `media_items` table and updates the store.
  - The overall behaviour and imagery usage is described in `IMAGE_INTEGRATION_SUMMARY.md`.

#### Customers & invoices
- Customer selection & creation:
  - `hooks/useCustomerSelection.ts` and components under `components/customers/` (`CustomerSelection`, `CustomerPickerModal`, `CustomerQuickAddModal`, etc.) implement a reusable **customer selection widget**.
  - This widget powers flows like job card creation and invoice creation by allowing:
    - Searching existing customers (`CustomerService.searchCustomers`).
    - Linking a chosen customer record.
    - Quickly adding a new customer and linking the result.
- Invoicing:
  - `services/invoiceService.ts` coordinates invoice creation, item persistence, and status updates.
  - Types in `types/invoice.ts` plus helpers in `lib/invoiceCalculations.ts` define how line items and totals are calculated and validated.
  - Components under `components/invoices/` and routes under `app/invoices/` (e.g. `app/invoices/create.tsx`, `app/invoices/[id].tsx`) use these services to provide invoice CRUD tied to locations.

### Design system & theming
- The **design system** is defined in `constants/design-system.ts` and described in `THEMING_GUIDE.md` and `UI_IMPROVEMENTS_SUMMARY.md`:
  - `BrandColors` defines the brand palette (surface, shellDark, primary, title, ink); all new UI should use these instead of hardcoded hex values.
  - `Colors`, `Typography`, `Spacing`, `BorderRadius`, and `Shadows` provide foundational tokens.
  - `ComponentStyles` offers shared styles for cards, buttons, inputs, tab bars, and headers.
  - `StatusColors` and `PriorityColors` are the canonical mappings for job-card statuses and priorities.
- `constants/theme.ts` adapts `BrandColors` into a light/dark theme map consumed by themed components and the Expo Router tab layout.
- Many screens (e.g. `app/(tabs)/_layout.tsx`, dashboard and jobcard screens, media hub, login) have been refactored to use the design system; remaining hardcoded colors are called out in `THEMING_GUIDE.md` as future cleanup targets.

### Database migrations & status updates
- Supabase migrations live under `supabase/migrations/`, including `20251110053705_create_ticket_status_updates.sql`.
- `STATUS_UPDATES_DB_SETUP.md` and `CUSTOM_STATUS_UPDATES_FEATURE.md` together describe:
  - The `ticket_status_updates` schema and indexes.
  - RLS policies ensuring users can only manipulate appropriate updates.
  - How the React Native components are wired to this schema via the services layer.

## How to extend this codebase safely
- When adding new screens, prefer placing them under the existing Expo Router groups:
  - Auth-related flows under `app/(auth)/`.
  - Role-specific post-login screens under `app/(tabs)/`, and integrate them into `app/(tabs)/_layout.tsx` with appropriate role/permission checks.
- Reuse the existing layers where possible:
  - Supabase access via the domain-specific services in `services/`.
  - Shared types from `types/` and helpers from `lib/`.
  - Global state from `stores/`, especially for auth and location context.
  - Design tokens from `constants/design-system.ts` instead of inline styles or hex colors.
- For anything touching Supabase schema or RLS, cross-check the SQL in `database/` and `supabase/migrations/` and, where relevant, the notes in the various `*_SUMMARY.md` and `*_SETUP.md` documents before changing types or queries.

