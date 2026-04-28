# Phased Implementation Plan

## Phase 0 — Foundation (complete)

- Bootstrap Next.js App Router with strict TypeScript.
- Add baseline health endpoint and mobile-first starter UI.

**Implemented files/directories:**

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `app/api/health/route.ts`
- `next.config.mjs`, `tsconfig.json`, `next-env.d.ts`

## Phase 1 — Data and Integration Backbone

**Goal:** establish reliable data capture and Shopify interoperability.

- Implement schema for orders, coordinate captures, and preview sessions.
- Build Shopify API clients with typed DTO mappers.
- Add webhook ingestion endpoint(s) with signature verification and idempotency keys.
- Add input validators for coordinates and personalization payloads.

**Create in this phase (concrete targets):**

- `lib/`
  - `lib/domain/coordinates.ts`
  - `lib/domain/preview-session.ts`
  - `lib/application/capture-coordinates.ts`
  - `lib/application/process-shopify-webhook.ts`
  - `lib/shopify/storefront-client.ts`
  - `lib/shopify/admin-client.ts`
  - `lib/shopify/mappers/`
  - `lib/infrastructure/persistence/`
  - `lib/core/result.ts`
- `app/api/webhooks/shopify/route.ts`
- `.env.example`

**ROI impact:** unlocks automation and eliminates manual reconciliation.

## Phase 2 — Personalized Product Preview MVP

**Goal:** increase conversion through preview confidence.

- Build preview payload model and rendering service.
- Add preview API route with deterministic cache keys.
- Add mobile-first preview UI component for product detail pages.
- Track key events: preview viewed, preview edited, add-to-cart after preview.

**Create in this phase (concrete targets):**

- `lib/preview/`
  - `lib/preview/build-preview-payload.ts`
  - `lib/preview/render-preview.ts`
- `app/api/preview/route.ts`
- `components/preview/preview-card.tsx`
- `components/preview/preview-controls.tsx`
- `app/(storefront)/products/[handle]/page.tsx`
- `public/preview/` (static placeholders/mock assets)

**ROI impact:** improves add-to-cart rate and reduces pre-purchase hesitation.

## Phase 3 — GPS Coordinate Capture Flow

**Goal:** capture accurate location context with low friction.

- Implement consent-first coordinate capture UX.
- Add browser and manual fallback capture modes.
- Validate precision/range and store normalized coordinate records.
- Attach coordinate metadata to cart/order attributes for Shopify downstream use.

**Create in this phase (concrete targets):**

- `lib/geo/`
  - `lib/geo/capture-browser-coordinates.ts`
  - `lib/geo/validate-coordinates.ts`
  - `lib/geo/normalize-coordinates.ts`
- `components/geo/coordinate-capture-form.tsx`
- `app/api/coordinates/route.ts`
- `app/(storefront)/coordinate-capture/page.tsx`

**ROI impact:** lowers support friction and enables location-driven fulfillment offerings.

## Phase 4 — Automation + Monetization Layer

**Goal:** create reusable SaaS value and recurring revenue potential.

- Add webhook-triggered automations (e.g., coordinate verification, notifications).
- Introduce merchant-facing configuration screen for premium rules.
- Build usage metering events for future billing tiers.
- Add scheduled jobs for retries, cleanup, and analytics rollups.

**Create in this phase (concrete targets):**

- `lib/automation/`
  - `lib/automation/run-coordinate-verification.ts`
  - `lib/automation/send-merchant-notification.ts`
- `app/(merchant)/settings/page.tsx`
- `app/api/usage-events/route.ts`
- `scripts/jobs/`
  - `scripts/jobs/retry-failed-webhooks.ts`
  - `scripts/jobs/rollup-analytics.ts`

**ROI impact:** enables subscription packaging and reduces operational workload.

## Phase 5 — Hardening and Scale

**Goal:** improve reliability under growth.

- Add unit/integration test coverage for core use-cases.
- Add performance budgets (LCP/CLS/API latency) and error budgets.
- Add request tracing, structured logging, and dead-letter flows.
- Prepare multi-tenant boundary rules for cross-store isolation.

**Create in this phase (concrete targets):**

- `tests/unit/`
- `tests/integration/`
- `tests/e2e/`
- `eslint.config.mjs`
- `lib/observability/logger.ts`
- `lib/observability/tracing.ts`
- `lib/infrastructure/dead-letter/`
- `docs/multi-tenant-boundaries.md`

**ROI impact:** protects conversion and margins as volume scales.
