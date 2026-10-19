# Phase 10c: Payments with Stripe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A signed-in learner buys B1, B2 or C1 (monthly or yearly) through Stripe Checkout, manages it in the Customer Portal, and the `subscriptions` row that 10b already reads follows Stripe through a webhook.

**Architecture:** Two server actions start Checkout or open the Portal (both hosted by Stripe, so no Stripe.js, no card data and no CSP script changes). One webhook route verifies the signature, re-reads the subscription from Stripe and upserts the learner's row with the secret-key Supabase client; access keeps coming from `getEntitlement()` and nothing else. Pure helpers (lookup key ↔ plan, subscription → row, which row wins) carry the logic and the tests; the I/O wrappers stay thin.

**Tech Stack:** Next 16 (server actions, route handlers), `stripe` 23.0.0 (Node SDK, pinned like the Supabase packages; it pins its own API version, which is Basil or later, so the billing period lives on `subscription.items.data[0].current_period_end`, not on the subscription), Supabase (`supabaseAdmin()`), next-intl, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-19-phase-10-tiers-design.md` (section 5; prices in section 1).

## Global Constraints

- Lookup keys, exactly: `sello_b1_month`, `sello_b1_year`, `sello_b2_month`, `sello_b2_year`, `sello_c1_month`, `sello_c1_year`. Code never holds a price id, so test and live mode share the code.
- Prices in EUR, `tax_behavior: "inclusive"`, amounts equal to `PRICES` in `src/lib/access/tiers.ts` (999 / 9590, 1499 / 14390, 1999 / 19190 cents).
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are read only in `server-only` modules, never with a `NEXT_PUBLIC_` prefix, never committed. Without them, payments are switched off (actions answer `unavailable`, the webhook answers 503) and the rest of Sello works as today.
- The return from Checkout never grants access; only the webhook writes `subscriptions`.
- Upgrades are immediate and prorated; downgrades and cancellations take effect at the end of the period (Portal configuration, Task 1).
- Account deletion (`deleteMyAccount`, `deleteUserAsAdmin`) cancels the Stripe subscription immediately first; if that fails, the account is not deleted.
- Stripe work through the MCP happens in **test mode only** (`livemode: false`). Live mode is the owner's job after the legal and tax steps in spec section 5.
- No new tables or migrations: `public.subscriptions` already has every column.
- `messages/es.json` and `messages/en.json` keep identical keys. British English. `npm run check` passes before every commit.

## Review Focus

1. An old subscription's late `customer.subscription.deleted` (or `.updated` to `canceled`) arriving after the learner already has a newer live subscription: the newer one must keep the row. Pinned by `shouldReplace` tests (Task 3).
2. Webhook for a learner whose account was just deleted (the deletion itself cancels the subscription and Stripe sends `.deleted` afterwards): the upsert hits the foreign key; the route must answer 200 and log, not 500, or Stripe retries for three days. Pinned by `isGoneUser` in the route and a unit test (Task 4).
3. A learner who abandons Checkout and tries again, or double-clicks: no orphan Stripe customers. `startCheckout` passes `customer_email` (Checkout creates the customer only on payment) unless the row already holds a `stripe_customer_id`. Pinned by `checkoutCustomer` tests (Task 5).
4. A subscription whose price has no Sello lookup key (created by hand in the dashboard, or a future product): the webhook ignores it with 200 and a log, and never writes a row with a guessed tier. Pinned by `rowFromSubscription` returning `null` (Task 3).
5. A learner whose subscription ended still sees "Manage subscription" or a paid tier on the account page: the panel uses `useTier()`, which already applies `tierFromRow` (period end included); past subscribers get "See plans". Checked in the manual run (Task 9).

---

### Task 1: Stripe test-mode catalogue, Portal and local setup

Owner steps first (ask the user and wait; nothing here is code):

- Confirm which Stripe account to use. The MCP lists only `acct_1URsfkAutnhDsUep` ("Entorno de prueba de Kartana", test mode). Do not create anything until the user confirms it is the right account or connects another.
- In that account's dashboard (test mode): enable Stripe Tax with the business's origin address (Checkout with `automatic_tax` fails without it) and set the terms of service URL under *Settings → Public details* to `https://sello-aptis.vercel.app/es/terminos` (Checkout's `consent_collection.terms_of_service` requires it).
- Put `STRIPE_SECRET_KEY` (test `sk_test_…` or a restricted key with Checkout, Customers read, Subscriptions write, Billing Portal write) in `.env.local`. `STRIPE_WEBHOOK_SECRET` comes from the Stripe CLI in Task 9.
- Install the Stripe CLI (`winget install Stripe.StripeCli`) and run `stripe login`.

**Files:**
- Modify: `package.json`, `package-lock.json` (`npm install stripe@23.0.0 --save-exact`, approved by the user on 2026-10-19)

- [ ] **Step 1: Create the catalogue** with the Stripe MCP in test mode: three products (`Sello B1`, `Sello B2`, `Sello C1`, `tax_code: txcd_10000000` "General - Electronically Supplied Services"), each with two recurring EUR prices (`interval` `month` / `year`), `tax_behavior: "inclusive"`, the amounts and lookup keys from Global Constraints.
- [ ] **Step 2: Create the Portal configuration** (MCP `billing_portal.configurations.create`, then make it the default): `features.subscription_update` enabled with `default_allowed_updates: ["price"]`, the three products with both prices each, `proration_behavior: "always_invoice"`, `schedule_at_period_end.conditions: [{ type: "decreasing_item_amount" }, { type: "shortening_interval" }]`; `subscription_cancel: { enabled: true, mode: "at_period_end" }`; `payment_method_update` and `invoice_history` enabled; `business_profile.privacy_policy_url` and `terms_of_service_url` set to the Spanish pages. Check the parameter names against the API reference (`search_stripe_documentation`) before the call.
- [ ] **Step 3: Verify** with the MCP: listing prices by the six lookup keys returns six active prices with the right amounts and `tax_behavior: "inclusive"`.
- [ ] **Step 4: Install** `stripe@23.0.0`; `npm run check` → pass.
- [ ] **Step 5: Commit** `chore(deps): add stripe` (record the product and Portal configuration ids in the commit body; they are not secrets).

### Task 2: Plans and lookup keys

**Files:**
- Create: `src/lib/stripe/plans.ts`, `src/lib/stripe/plans.test.ts`

**Interfaces:**
- Consumes: `PaidTier` from `tiers.ts`.
- Produces:
  - `type BillingInterval = "month" | "year"`
  - `lookupKeyFor(tier: PaidTier, interval: BillingInterval): string` → `` `sello_${tier}_${interval}` ``
  - `planFromLookupKey(key: string | null | undefined): { tier: PaidTier; interval: BillingInterval } | null`

- [ ] **Step 1: Write the failing tests**: every one of the six keys round-trips through `lookupKeyFor` / `planFromLookupKey`; `planFromLookupKey` returns `null` for `null`, `undefined`, `""`, `"sello_a2_month"`, `"sello_b1_week"`, `"other_b1_month"` and `"sello_b1_month_extra"`.
- [ ] **Step 2: Run** `npx vitest run src/lib/stripe/plans.test.ts` → fails (module missing).
- [ ] **Step 3: Implement** with one regex `^sello_(b1|b2|c1)_(month|year)$`.
- [ ] **Step 4: Run** → pass.
- [ ] **Step 5: Commit** `feat(stripe): lookup keys for the six prices`.

### Task 3: From a Stripe subscription to a row

**Files:**
- Create: `src/lib/stripe/sync.ts`, `src/lib/stripe/sync.test.ts`

**Interfaces:**
- Consumes: `planFromLookupKey` (Task 2); `tierFromRow`, `SubscriptionRow` from `src/lib/access/rule.ts`; the `Stripe.Subscription` type (type-only import from `stripe`).
- Produces:
  - `type SubscriptionUpsert = SubscriptionRow & { user_id: string; interval: BillingInterval; cancel_at_period_end: boolean; stripe_customer_id: string; stripe_subscription_id: string; updated_at: string }`
  - `rowFromSubscription(sub: Stripe.Subscription, now: number): SubscriptionUpsert | null`: `user_id` from `sub.metadata.user_id` (must be a UUID, else `null`); tier and interval from `sub.items.data[0].price.lookup_key` (unknown → `null`); `current_period_end` from `sub.items.data[0].current_period_end` (Unix seconds → ISO string); `status`, `cancel_at_period_end` as given; `stripe_customer_id` from `sub.customer` (string or object's `id`); `updated_at` = `new Date(now).toISOString()`.
  - `shouldReplace(existing: Pick<SubscriptionUpsert, "stripe_subscription_id" | "tier" | "status" | "current_period_end"> | null, incoming: SubscriptionUpsert, now: number): boolean`: `true` when there is no row, when it is the same subscription, or when the existing one no longer grants access (`tierFromRow(existing, now) === "free"`); `false` when the existing row is a **different** subscription that is still live and the incoming one is not.
  - `subscriptionIdOf(event: Stripe.Event): string | null`: `checkout.session.completed` → `session.mode === "subscription"` ? `session.subscription` (string or object id) : `null`; `customer.subscription.created | updated | deleted` → `data.object.id`; anything else → `null`.

- [ ] **Step 1: Write the failing tests** with small fixtures cast through `as unknown as Stripe.Subscription` (only the fields read):
  - A live B2 yearly fixture (`metadata.user_id` a UUID, `lookup_key: "sello_b2_year"`, `current_period_end: 1893456000`, `customer: "cus_1"`) → the full row, `current_period_end: "2030-01-01T00:00:00.000Z"`, `interval: "year"`.
  - `customer` given as `{ id: "cus_1" }` → same `stripe_customer_id`.
  - No `metadata.user_id`, a non-UUID `user_id`, an unknown lookup key, a `null` lookup key → `null` (Review Focus 4).
  - `shouldReplace(null, …)` → `true`; same subscription id with `status: "canceled"` → `true`; existing other subscription `active` with a future period end and incoming `canceled` → `false` (Review Focus 1); existing other subscription `canceled` and incoming `active` → `true`; existing other subscription `active` but period ended and incoming `canceled` → `true`.
  - `subscriptionIdOf`: a completed subscription session with `subscription: "sub_1"` → `"sub_1"`; a `payment`-mode session → `null`; `customer.subscription.deleted` → its object id; `invoice.paid` → `null`.
- [ ] **Step 2: Run** `npx vitest run src/lib/stripe/sync.test.ts` → fails.
- [ ] **Step 3: Implement** (pure; only a type import from `stripe`).
- [ ] **Step 4: Run** → pass.
- [ ] **Step 5: Commit** `feat(stripe): map subscriptions to rows and pick the row that wins`.

### Task 4: Stripe client and the webhook

**Files:**
- Create: `src/lib/stripe/server.ts`, `src/app/api/stripe/webhook/route.ts`, `src/lib/stripe/webhook.test.ts`

**Interfaces:**
- Consumes: `rowFromSubscription`, `shouldReplace`, `subscriptionIdOf` (Task 3); `supabaseAdmin()`.
- Produces:
  - `stripeServer(): Stripe | null` (`import "server-only"`): `null` without `STRIPE_SECRET_KEY`; one instance per process; no `apiVersion` option (use the SDK's pinned one, which the types match).
  - `isGoneUser(error: { code?: string } | null): boolean` → `error?.code === "23503"` (foreign key: the user no longer exists), exported from `sync.ts`.
  - `POST(request: Request): Promise<Response>` in the route:
    1. No Stripe client, no `STRIPE_WEBHOOK_SECRET` or no `supabaseAdmin()` → 503.
    2. `stripe.webhooks.constructEvent(await request.text(), request.headers.get("stripe-signature") ?? "", secret)`; a throw → 400.
    3. `subscriptionIdOf(event)` is `null` → 200 (`console.info("sello: stripe event ignored", event.type)`).
    4. `stripe.subscriptions.retrieve(id)` (the event's copy may be stale or out of order); `rowFromSubscription(sub, Date.now())` is `null` → 200 + `console.warn` with the subscription id (never the email).
    5. Read the learner's current row (`stripe_subscription_id, tier, status, current_period_end`) with the admin client; `!shouldReplace(existing, row, Date.now())` → 200 + `console.info`.
    6. `upsert(row, { onConflict: "user_id" })`; `isGoneUser(error)` → 200 + `console.info` (Review Focus 2); any other error, or a throw from Stripe → 500 so Stripe retries.

- [ ] **Step 1: Write the failing tests** in `webhook.test.ts`: `isGoneUser({ code: "23503" })` → `true`, `isGoneUser({ code: "42501" })` and `isGoneUser(null)` → `false`; signature check with the SDK's own helper: `const stripe = new Stripe("sk_test_dummy")`, a JSON payload of a `customer.subscription.updated` event, `stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test" })` → `constructEvent` returns the event; the same header with a tampered payload throws.
- [ ] **Step 2: Run** `npx vitest run src/lib/stripe` → fails.
- [ ] **Step 3: Implement** `server.ts`, `isGoneUser` and the route.
- [ ] **Step 4: Run** Vitest → pass; `npm run check` → pass.
- [ ] **Step 5: Commit** `feat(stripe): webhook keeps the subscriptions row in step with Stripe`.

### Task 5: Start Checkout and open the Portal

**Files:**
- Create: `src/lib/stripe/actions.ts` (`"use server"`), `src/lib/stripe/checkout.ts`, `src/lib/stripe/checkout.test.ts`
- Modify: `next.config.ts` (CSP `form-action 'self' https://checkout.stripe.com https://billing.stripe.com`, so the no-JavaScript form redirect is allowed; update the comment above `csp`)

**Interfaces:**
- Consumes: `stripeServer()`, `lookupKeyFor`, `tierFromRow`, `SubscriptionRow`, `supabaseServer()`, `getPathname` from `@/i18n/navigation`, `SITE`.
- Produces:
  - In `checkout.ts` (pure):
    - `checkoutOrPortal(row: SubscriptionRow | null, now: number): "checkout" | "portal"` → `"portal"` when `tierFromRow(row, now) !== "free"`.
    - `checkoutCustomer(customerId: string | null, email: string): { customer: string; customer_update: { address: "auto"; name: "auto" } } | { customer_email: string }`.
    - `WAIVER: Record<"es" | "en", (termsUrl: string) => string>`: the consent text shown beside Stripe's terms checkbox (exact copy below).
  - In `actions.ts`:
    - `type PaymentResult = { status: "error"; message: "unavailable" | "signedOut" | "failed" }`
    - `startCheckout(tier: PaidTier, interval: BillingInterval, locale: "es" | "en"): Promise<PaymentResult>`: validate the arguments with Zod; `unavailable` without Stripe or Supabase; `signedOut` without claims; read the learner's own row (`tier, status, current_period_end, stripe_customer_id`) with the server client; if `checkoutOrPortal` says portal, create a Portal session and `redirect()` to it; otherwise find the price with `stripe.prices.list({ lookup_keys: [key], active: true })`, create a Checkout Session and `redirect(session.url)`. Session parameters: `mode: "subscription"`, `line_items: [{ price, quantity: 1 }]`, `client_reference_id: userId`, `subscription_data: { metadata: { user_id: userId } }`, `...checkoutCustomer(row?.stripe_customer_id ?? null, claims.email)`, `automatic_tax: { enabled: true }`, `billing_address_collection: "required"`, `consent_collection: { terms_of_service: "required" }`, `custom_text: { terms_of_service_acceptance: { message: WAIVER[locale](termsUrl) } }`, `locale: locale === "en" ? "en-GB" : "es"`, `success_url` / `cancel_url` = origin + `getPathname({ href: "/account", locale })` + `?checkout=success` / `?checkout=cancel`. Origin as in `src/lib/auth/actions.ts` (`headers().get("origin") ?? SITE.url`). Stripe errors → `failed` (log the Stripe error code, not the message).
    - `openPortal(locale: "es" | "en"): Promise<PaymentResult>`: same guards; no `stripe_customer_id` in the learner's row → `failed`; otherwise `billingPortal.sessions.create({ customer, return_url: origin + account path, locale })` and `redirect()`.
  - Waiver copy (Markdown link, Stripe renders it):
    - es: `Acepto los [términos](${termsUrl}) y pido acceso inmediato al contenido digital, por lo que pierdo el derecho de desistimiento de 14 días.`
    - en: `I agree to the [terms](${termsUrl}) and ask for immediate access to the digital content, so I lose the 14-day right of withdrawal.`
    - `termsUrl` = origin + `getPathname({ href: "/terms", locale })`.
  - `redirect()` throws by design: call it outside any `try`.

- [ ] **Step 1: Write the failing tests** in `checkout.test.ts`: `checkoutOrPortal(null, now)` → `"checkout"`; a live B1 row → `"portal"`; a `canceled` row and an `active` row whose period ended → `"checkout"`; `checkoutCustomer(null, "a@b.c")` → `{ customer_email: "a@b.c" }` (Review Focus 3); `checkoutCustomer("cus_1", …)` → `{ customer: "cus_1", customer_update: { address: "auto", name: "auto" } }`; `WAIVER.es("https://x/es/terminos")` contains `](https://x/es/terminos)` and `14 días`.
- [ ] **Step 2: Run** `npx vitest run src/lib/stripe/checkout.test.ts` → fails.
- [ ] **Step 3: Implement** `checkout.ts`, `actions.ts` and the CSP line.
- [ ] **Step 4: Run** Vitest → pass; `npm run check` → pass.
- [ ] **Step 5: Commit** `feat(stripe): checkout and customer portal actions`.

### Task 6: Buttons on the plans placeholder and the account page

**Files:**
- Create: `src/components/account/PlanSection.tsx` (`"use client"`), `src/components/plans/SubscribeButtons.tsx` (`"use client"`), `src/components/account/CheckoutNotice.tsx` (`"use client"`, `useSearchParams`)
- Modify: `src/app/[locale]/plans/page.tsx`, `src/components/account/AccountPanel.tsx`, `src/app/[locale]/account/page.tsx`, `messages/es.json`, `messages/en.json`

**Interfaces:**
- Consumes: `startCheckout`, `openPortal`, `PaymentResult` (Task 5); `useTier`, `useUser`, `TIER_LEVEL`.
- Produces:
  - `<SubscribeButtons tier={PaidTier} />`: two submit buttons ("Pagar mensual" / "Pay monthly", "Pagar anual" / "Pay yearly") in one `<form>` per button calling `startCheckout(tier, interval, locale)` through `useActionState`; signed out (`useUser() === null`) renders a `ButtonLink` to `/sign-in` ("Entra para suscribirte" / "Sign in to subscribe") instead; errors shown in a `role="alert"` paragraph from `Payments.messages.<message>`. Added under each paid tier's line on `/plans`. 10d replaces this page; keep it plain.
  - `<PlanSection />` in `AccountPanel`, between the "who" section and the password section, heading "Tu plan" / "Your plan": `useTier()` undefined → nothing; `free` → "Plan gratuito (A2)" / "Free plan (A2)" + `ButtonLink` "Ver planes" / "See plans"; paid → "Plan {level}" + a form calling `openPortal(locale)` with "Gestionar suscripción" / "Manage subscription" and the hint "Cambia de plan, cancela o descarga facturas en Stripe." / "Change plan, cancel or download invoices on Stripe."
  - `<CheckoutNotice />` above `AccountPanel` inside `<Suspense fallback={null}>`: `?checkout=success` → `role="status"` "Pago recibido. Tu plan se activa en unos segundos; si no lo ves, recarga la página." / "Payment received. Your plan will be active in a few seconds; reload the page if you don't see it."; `?checkout=cancel` → "Has salido del pago sin suscribirte." / "You left the payment without subscribing."; anything else → nothing.
  - Messages: namespace `Payments` (`monthly`, `yearly`, `signInToSubscribe`, `messages.unavailable` "Los pagos no están disponibles ahora mismo." / "Payments aren't available right now.", `messages.signedOut`, `messages.failed`) and `Account.plan.*`, `Account.checkout.*`.

- [ ] **Step 1:** Copy is covered by the messages parity test; the components have no logic beyond the branches above. Write the components and messages.
- [ ] **Step 2: Run** `npm run check` → pass; `npm run e2e -- e2e/a11y*.spec.ts` → pass (axe on `/plans` and `/account` in both themes).
- [ ] **Step 3: Commit** `feat(stripe): subscribe and manage buttons`.

### Task 7: Cancel Stripe before deleting an account

**Files:**
- Create: `src/lib/stripe/cancel.ts` (`import "server-only"`)
- Modify: `src/lib/auth/actions.ts` (`deleteMyAccount`), `src/lib/admin/actions.ts` (`deleteUserAsAdmin`)
- Test: `src/lib/stripe/checkout.test.ts` (pure part)

**Interfaces:**
- Consumes: `stripeServer()`, `supabaseAdmin()`.
- Produces:
  - `needsCancelling(row: { status: string; stripe_subscription_id: string | null } | null): boolean` (pure, in `checkout.ts`): `true` when there is a subscription id and `status` is not `canceled` or `incomplete_expired`.
  - `cancelStripeFor(userId: string): Promise<boolean>`: reads the row with the admin client; `needsCancelling` false → `true`; otherwise needs `stripeServer()` (missing → `false`) and calls `stripe.subscriptions.cancel(id)`; Stripe's `resource_missing` error counts as already cancelled (`true`); any other error → `false`.
  - `deleteMyAccount`: after reading the claims and before `signOut({ scope: "global" })`, `if (!(await cancelStripeFor(userId))) return { status: "error", message: "failed" }`.
  - `deleteUserAsAdmin`: before `deleteUser`, `if (!(await cancelStripeFor(target.data))) return;`.

- [ ] **Step 1: Write the failing tests**: `needsCancelling(null)` → `false`; `{ status: "active", stripe_subscription_id: "sub_1" }` and `{ status: "past_due", … }` → `true`; `canceled`, `incomplete_expired` and a `null` subscription id → `false`.
- [ ] **Step 2: Run** → fails.
- [ ] **Step 3: Implement** and wire both actions.
- [ ] **Step 4: Run `npm run check`** → pass.
- [ ] **Step 5: Commit** `feat(stripe): cancel the subscription before deleting an account`.

### Task 8: Admin numbers and legal texts

**Files:**
- Modify: `src/lib/admin/stats.ts`, `src/lib/admin/stats.test.ts`, `src/lib/admin/data.ts`, `src/app/admin/page.tsx`
- Modify: `src/app/[locale]/terms/page.tsx`, `src/app/[locale]/privacy/page.tsx` (and their messages), `docs/legal/README.md`

**Interfaces:**
- Consumes: `tierFromRow`, `PRICES`.
- Produces:
  - `summariseSubscriptions(rows: readonly (SubscriptionRow & { interval: "month" | "year" })[], now: number): { counts: Record<PaidTier, { month: number; year: number }>; monthlyCents: number }`: only rows where `tierFromRow` is not `free`; `monthlyCents` = sum of `PRICES[tier].month` for monthly rows plus `Math.round(PRICES[tier].year / 12)` for yearly rows (estimate from display prices, VAT included; say so on the page).
  - `loadAdminData()` also returns `subscriptions` from `select("tier, interval, status, current_period_end")`; the admin page gets a "Suscripciones" section: a table tier × interval and "Ingresos mensuales estimados (IVA incluido): {formatPrice(monthlyCents, "es")}".
  - Terms: a "Planes y pagos" / "Plans and payments" section: prices include VAT; automatic renewal per month or year; cancel any time in the Portal, effective at the end of the paid period; upgrades immediate and prorated, downgrades at the end of the period; on a downgrade or end, progress is kept but content above the plan's level locks again; the 14-day withdrawal right is lost when the learner asks for immediate access at checkout (art. 103 m) of the Spanish consumer law, TRLGDCU); deleting the account cancels the subscription at once without a refund of the current period.
  - Privacy: Stripe Payments Europe as processor (name, email, billing address, payment method handled by Stripe, never by Sello; invoices kept by Stripe for the tax retention period); `subscriptions` row (plan, status, dates, Stripe ids) deleted with the account.
  - `docs/legal/README.md`: Stripe in the processors row, the billing data, the Stripe DPA (accepted with Stripe's services agreement), and the owner tasks from spec section 5 (tax registration, OSS, Stripe Tax and live activation, professional review).

- [ ] **Step 1: Write the failing test** in `stats.test.ts`: two live monthly B1, one live yearly C1, one canceled B2 and one active B2 with an ended period → `counts.b1.month === 2`, `counts.c1.year === 1`, `counts.b2` all 0, `monthlyCents === 2 * 999 + Math.round(19190 / 12)`.
- [ ] **Step 2: Run** → fails.
- [ ] **Step 3: Implement** the stats, the admin section and the legal texts (copy in both languages; British English).
- [ ] **Step 4: Run `npm run check`** → pass.
- [ ] **Step 5: Commit** `feat(stripe): subscription numbers for admin; terms and privacy cover payments`.

### Task 9: Manual run in test mode and close 10c

**Files:**
- Modify: `docs/status.md`, `CLAUDE.md`

- [ ] **Step 1: Webhook secret**: the user runs `stripe listen --forward-to localhost:3000/api/stripe/webhook` and puts the printed `whsec_…` in `.env.local` as `STRIPE_WEBHOOK_SECRET`; restart the dev server.
- [ ] **Step 2: Manual checks** (the user drives the browser; check the `sello-dev` row after each with the Supabase MCP, selecting only `tier, interval, status, current_period_end, cancel_at_period_end` for the user's id):
  1. Signed out, `/plans` shows "Sign in to subscribe".
  2. Signed in, B1 monthly with card `4242 4242 4242 4242`: Checkout shows the waiver text and VAT included; back on the account page the success notice shows; the row becomes `b1 / month / active`; a B1 lesson opens and a B2 lesson is locked.
  3. "Manage subscription" → Portal → switch to B2 yearly: the row becomes `b2 / year` at once.
  4. Portal → switch down to B1 monthly: the row stays `b2` until the period end (scheduled).
  5. Portal → cancel: `cancel_at_period_end: true`, access kept.
  6. `stripe trigger customer.subscription.updated` for an unrelated subscription (no `user_id`) → 200 in the CLI output, row unchanged.
  7. Delete the account with a live subscription: the subscription is `canceled` in Stripe, the user is gone, the `.deleted` webhook answers 200.
- [ ] **Step 3: Run `npm run check`** and **`npm run e2e`** → pass (the signed-in cases skip without the Supabase secret key; say so).
- [ ] **Step 4: Status notes**: new "Phase 10c" section in `docs/status.md` (files, the Basil period-end gotcha, Portal and product ids in test mode, how to test locally with the CLI, what production still needs: live products with the same lookup keys, live Portal configuration, a webhook endpoint at `https://<site>/api/stripe/webhook` with the four events, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel, and the owner's legal and tax steps); `CLAUDE.md` status line (10c done, next 10d).
- [ ] **Step 5: Commit** `docs: phase 10c status` and sync the mirror.
