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
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── health/route.ts       # basic health endpoint
│   ├── globals.css               # global styles (mobile-first defaults)
│   ├── layout.tsx                # root layout
│   └── page.tsx                  # MVP landing page shell
├── components/                   # presentational React components
├── lib/
│   ├── application/              # use-cases / orchestration
│   ├── core/                     # shared primitives (errors, result types)
│   ├── domain/                   # business entities + rules
│   ├── geo/                      # GPS capture + coordinate validation utilities
│   ├── infrastructure/           # external adapters (DB, webhooks)
│   ├── preview/                  # personalized product preview services
│   └── shopify/                  # Shopify clients + mapping
├── docs/
│   └── implementation-plan.md    # phased build plan
├── public/                       # static assets
├── scripts/                      # automation scripts for CI/dev tasks
├── tests/                        # unit/integration test entry points
├── .env.example                  # environment contract
├── .gitignore
├── eslint.config.mjs
├── next.config.mjs
├── package.json
└── tsconfig.json
```

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Core principles implemented

1. **No bloated dependencies**: only runtime dependency is `next`, `react`, `react-dom`.
2. **Safety-first bootstrapping**: strict TS, linting, and explicit env variable contract.
3. **Conversion-aware architecture**: clear module boundaries for personalized previews and checkout-impacting UX.
4. **Automation-ready**: folders prepped for webhook handlers and scheduled jobs.

## Next step

Follow the phased plan in `docs/implementation-plan.md` before implementing features.
