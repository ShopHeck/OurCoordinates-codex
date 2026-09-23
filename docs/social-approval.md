# OurCoordinates social approvals

This app uses `@opencoredev/social-sdk@0.2.1` for Instagram delivery. The Shopify theme is unchanged.

## Flow

1. A daily GitHub Actions wake-up calls `POST /api/social/watch`. The app scans only when 48 hours have passed since the last successful scan. The scan reads published Shopify products through the Storefront API and compares title, description, image, price, and product URL. It ignores inventory and timestamp-only changes.
2. The first successful scan records the catalog and drafts one pilot product. Later scans draft new or materially changed products with an image. A unique product/fingerprint constraint prevents duplicate drafts.
3. At `/social`, sign in as `owner` with `SOCIAL_ADMIN_PASSWORD`, review the actual product image, source URL, creative direction, and editable caption. Save, approve, or reject. **Approval never publishes.**
4. Press **Publish approved post to Instagram** for an approved draft. The Social SDK submits it to the configured Instagram professional account. Postgres stores SDK idempotency outcomes and Instagram container workflows. Pending posts can be checked again; unknown submissions require an Instagram check before any manual retry.

The first release uses the product's real image and an editorial caption template. The creative direction is a brief for later generated imagery, not a claim that new imagery was produced. No captions mention unverified metals, engraving, price, or shipping promises.

## Configuration

Deploy this Next.js app on Node.js 22.12+ with a persistent Postgres database. Set the following server-side values in your deployment from Infisical:

| Variable | Purpose |
| --- | --- |
| `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_API_VERSION`, `DATABASE_URL` | Existing app environment contract; the product scan uses the Storefront token. |
| `SOCIAL_STORE_URL` | Canonical `https://ourcoordinates.com` product URL base. |
| `SOCIAL_ADMIN_PASSWORD` | Long random password for the private `/social` review page. Use HTTPS only. |
| `SOCIAL_CRON_TOKEN` | Separate long random bearer token for the watch endpoint. |
| `SOCIAL_INSTAGRAM_ACCOUNT_ID`, `SOCIAL_INSTAGRAM_ACCESS_TOKEN` | Instagram professional account ID and token with publishing permission. |

Set GitHub Actions secrets `SOCIAL_WATCH_URL` (the app's HTTPS origin, without a trailing slash) and `SOCIAL_CRON_TOKEN` (same value used by the deployment). The scheduled job exits without scanning until both are configured. `workflow_dispatch` provides a manual wake-up; the 48-hour gate still applies. The owner can scan immediately with **Check products now**.

The Instagram token must be for the selected account. Meta app authorization, token refresh or rotation, and account permission remain operational responsibilities. This first release targets one account configured in server environment variables; it has no multi-account OAuth screen. Keep every token out of browser code and git.

## Delivery rules

- Posts require a separate approval and publish action. Concurrent publish requests claim the draft once in Postgres.
- `published` requires a native Instagram post ID. `accepted` or `processing` remain pending, and the app offers status reconciliation.
- A lost provider response is marked `unknown`; there is no automatic retry. A response lost after the platform accepted a post can otherwise create a duplicate.
- Draft and workflow records persist across server restarts. Postgres tables are created on the first social request.
- The operator endpoints require HTTP Basic credentials and same-origin form submissions. Serve the app only over HTTPS.

## Review before enabling a live post

1. Verify the Infisical values belong to **OurCoordinates**, especially the Shopify domain and Instagram account ID.
2. Visit `/social` and use **Check products now**. The first scan should create one draft and leave all other existing products as the baseline.
3. Review and edit that caption and image against its product page. Approve it, then use the separate publish button when ready.
4. Confirm the post appears in the intended Instagram account and the dashboard shows `published`. If it shows `unknown`, inspect Instagram before any further action.

The Shopify connection in the current assistant session needs reauthentication, and this workspace has no Infisical session. These live checks therefore remain pending; local type checking, linting, and build validation can run without live credentials.
