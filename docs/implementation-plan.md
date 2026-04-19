# Phased Implementation Plan

## Phase 0 — Foundation (complete)

- Bootstrap Next.js App Router with strict TypeScript.
- Create clean architecture module boundaries in `lib/`.
- Add baseline health endpoint and mobile-first starter UI.
- Define environment contract for Shopify and data layer.

## Phase 1 — Data and Integration Backbone

**Goal:** establish reliable data capture and Shopify interoperability.

- Implement schema for orders, coordinate captures, and preview sessions.
- Build `lib/shopify` clients for Storefront/Admin API with typed DTO mappers.
- Add webhook ingestion endpoint(s) with signature verification and idempotency keys.
- Add input validators for coordinates and personalization payloads.

**ROI impact:** unlocks automation and eliminates manual reconciliation.

## Phase 2 — Personalized Product Preview MVP

**Goal:** increase conversion through preview confidence.

- Build preview payload model (`lib/preview`) and rendering service.
- Add preview API route with deterministic cache keys.
- Add mobile-first preview UI component for product detail pages.
- Track key events: preview viewed, preview edited, add-to-cart after preview.

**ROI impact:** improves add-to-cart rate and reduces pre-purchase hesitation.

## Phase 3 — GPS Coordinate Capture Flow

**Goal:** capture accurate location context with low friction.

- Implement consent-first coordinate capture UX.
- Add browser and manual fallback capture modes.
- Validate precision/range and store normalized coordinate records.
- Attach coordinate metadata to cart/order attributes for Shopify downstream use.

**ROI impact:** lowers support friction and enables location-driven fulfillment offerings.

## Phase 4 — Automation + Monetization Layer

**Goal:** create reusable SaaS value and recurring revenue potential.

- Add webhook-triggered automations (e.g., coordinate verification, notifications).
- Introduce merchant-facing configuration screen for premium rules.
- Build usage metering events for future billing tiers.
- Add scheduled jobs for retries, cleanup, and analytics rollups.

**ROI impact:** enables subscription packaging and reduces operational workload.

## Phase 5 — Hardening and Scale

**Goal:** improve reliability under growth.

- Add unit/integration test coverage for core use-cases.
- Add performance budgets (LCP/CLS/API latency) and error budgets.
- Add request tracing, structured logging, and dead-letter flows.
- Prepare multi-tenant boundary rules for cross-store isolation.

**ROI impact:** protects conversion and margins as volume scales.
