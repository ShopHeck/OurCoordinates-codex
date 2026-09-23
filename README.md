# OurCoordinates

Performance-first, Shopify-compatible foundation for personalized product previews and GPS coordinate capture.

## Why this foundation

This repository is intentionally bootstrapped for **fast MVP shipping** and **clean scaling paths**:

- **Performance-first**: Next.js App Router, server components by default, strict TypeScript, and low-dependency setup.
- **Shopify-compatible**: clear integration boundary for Storefront/Admin API and webhooks.
- **Clean architecture**: domain and application logic separated from frameworks.
- **Mobile-first**: app structure optimized for responsive storefront UX and quick checkout funnels.
- **Future-proof for monetization**: reusable service boundaries to evolve into SaaS-style multi-tenant workflows.

## Recommended project structure

```txt
.
├── app/                              # present
│   ├── api/                          # present
│   │   └── health/route.ts           # present: basic health endpoint
│   ├── globals.css                   # present: global styles
│   ├── layout.tsx                    # present: root layout
│   └── page.tsx                      # present: app shell page
├── docs/                             # present
│   └── implementation-plan.md        # present: phased build plan
├── next-env.d.ts                     # present
├── next.config.mjs                   # present
├── package-lock.json                 # present
├── package.json                      # present
├── tsconfig.json                     # present
├── components/                       # planned (Phase 2): reusable UI components
├── lib/                              # planned (Phases 1-4): domain/application/integration modules
├── public/                           # planned (Phase 2): static preview/media assets
├── scripts/                          # planned (Phase 4): jobs and automation tooling
├── tests/                            # planned (Phase 5): unit/integration/e2e coverage
├── .env.example                      # planned (Phase 1): environment contract
└── eslint.config.mjs                 # planned (Phase 5): linting hardening
```

### Current maturity

This codebase is an early foundation. The App Router shell, health endpoint, Shopify API clients and webhook intake, coordinate capture, product preview, and the private social approval workflow are present. See `docs/implementation-plan.md` for the remaining work; live integrations require the matching service credentials and deployment.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Social content approvals

The app now includes a private `/social` review queue for product-derived Instagram drafts, backed by Postgres and `@opencoredev/social-sdk`. Product checks run at most once every 48 hours on the scheduled path; approving a draft and publishing it are separate actions. See [social approval setup](docs/social-approval.md) for the server-side configuration, first-run behavior, and live verification steps.

## Environment validation

Server-side environment variables are validated during module initialization in `lib/core/env.ts`. If a required value is missing or malformed (for example `SHOPIFY_API_VERSION` or `DATABASE_URL`), the app throws a startup error that includes the exact variable name in the server logs / terminal output so the configuration can be fixed immediately.

## Core principles implemented

1. **Small dependency surface**: Next.js, React, Postgres, and the Social SDK serve the application and approval workflow.
2. **Safety-first bootstrapping**: strict TS, linting, and explicit env variable contract.
3. **Conversion-aware architecture**: clear module boundaries for personalized previews and checkout-impacting UX.
4. **Automation-ready**: folders prepped for webhook handlers and scheduled jobs.

## Next step

Follow the phased plan in `docs/implementation-plan.md` before implementing features.

## Linting

This project uses Next.js App Router linting via a flat ESLint config (`eslint.config.mjs`) with `next/core-web-vitals` and `next/typescript`, so React and TypeScript checks run together.

Run lint locally with:

```bash
npm run lint
```

Expected behavior: ESLint scans the app source and ignores build/dependency artifacts such as `.next/` and `node_modules/` (plus generated output folders).
