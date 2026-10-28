# Polar.sh integration handoff

## Current status

**Live support is implemented and staged for the next publish.** Development
always uses sandbox; production uses only the separate live credentials and
requires `POLAR_LIVE_ENABLED=true`. The public app is not updated until republished.
Both live products passed read-only provider validation: USD 88 every three
months and USD 168 one time for six months. Both sandbox initial purchases were
verified with real sandbox provider data. No real-money charge was made.

Mock-provider checks cover both environments, raw signatures, account ownership,
duplicate deliveries, concurrent checkout clicks, renewals and preservation of
remaining access. Signed-in mobile browser checks cover both plans, portal
redirects, environment notices, and Chinese/English copy. Provider requests in
those browser checks are intercepted; they do not create live checkouts.

Administrators can use "Check Polar connection" on the Subscription screen
to verify both products. Token and product values are never returned. Configuration
presence is not successful validation. Checkout requires the webhook secret and
revalidates the exact product terms before creating each provider session.

Receiver: `POST /api/webhooks/polar`. Use a newly generated Standard Webhooks
secret, Raw format, API version **2026-10**, and events `order.paid`,
`order.refunded`, `subscription.updated`, `subscription.canceled`,
`subscription.revoked`, `subscription.past_due`. Non-payment lifecycle events
are acknowledged without extending access; paid access is not cut short on
cancellation or a failed renewal. Partial refunds leave the purchased period
unchanged; a full refund removes only its entitlement when doing so would not
overwrite later access changes. Subscription revocation does not erase paid time.

Checkout returns to `/dashboard?tab=subscription&payment=success&reference=...`.
The server generates the reference and only reports payment confirmation for an
owned matching checkout. Return URLs never grant access. Duplicate order IDs
cannot extend access twice. Provider bindings are environment-tagged and cascade
away on learner deletion. Existing records default to sandbox, never live.

Local verification:
`NODE_ENV=development POLAR_ACCESS_TOKEN=local-test-placeholder POLAR_LIVE_ACCESS_TOKEN=local-live-placeholder RUN_POLAR_TESTS=1 node --import tsx --test server/tests/polarSandbox.test.ts server/tests/polarConfig.test.ts server/tests/billingReadiness.test.ts server/tests/polarSandboxRelay.test.mjs`
uses a mock provider and signed synthetic events, not real Polar transactions.
It is not a substitute for an actual sandbox checkout/webhook end-to-end test.

### Sandbox forwarding through private preview

Keep the `Start application` workflow running, then run the
`Polar sandbox forwarding` console workflow (`npm run polar:sandbox:forward`).
Its separate `POLAR_CLI_ACCESS_TOKEN` needs only `organizations:read` and
`webhooks:read`. Do not replace the checkout token with this limited token.

The forwarder binds an ephemeral loopback-only port, consumes Polar CLI's raw
signing key internally, verifies each CLI signature, and re-signs the unchanged
body in memory with the existing app webhook key. The public handler still
checks its signature and fetches authoritative sandbox order state. Neither key,
provider payload, nor customer details are printed or written to a file.

This bypasses preview ingress, not authentication. Private preview can stay on.
Old dashboard delivery attempts may still show 307 because CLI receives events
through a separate stream; it does not repair those historical HTTP deliveries.
The CLI stream needs an explicit event replay for old paid orders, not another
purchase. Use the existing paid order ID in an `order.paid` trigger; the app
retrieves the actual order from Polar before granting access.

This is temporary development infrastructure, not production delivery. It stops
when the workspace stops. Restart forwarding after rotating either token or the
webhook key. Live activation still needs a published webhook endpoint and live
configuration verified separately.

The installed stable SDK did not provide the documented 2026-10 versioned import.
The server therefore uses Polar's documented REST API with `Polar-Version:
2026-10` and the official Standard Webhooks library. Never implement custom HMAC.

## Exact product terms

| App plan | USD amount | Polar product | App access |
| --- | --- | --- | --- |
| quarterly | 88.00 (8800 cents) | Fixed recurring, month interval, count 3 | Every paid three-month period |
| semiannual | 168.00 (16800 cents) | Fixed one-time purchase | Six months, not lifetime |

Both cover all Amharic and Swahili courses. Six-month access is one payment,
not an automatically renewing six-month subscription. Polar's default lifetime
one-time benefit must not become lifetime app access.

## Configuration names reserved by this project

Set secrets only through workspace Secrets, never source files or chat:

- `POLAR_ACCESS_TOKEN`: sandbox-only app API access.
- `POLAR_WEBHOOK_SECRET`: sandbox dashboard endpoint signing secret.
- `POLAR_LIVE_ACCESS_TOKEN`: live-only app API access.
- `POLAR_LIVE_WEBHOOK_SECRET`: live dashboard endpoint signing secret.
- `POLAR_CLI_ACCESS_TOKEN`: sandbox-only forwarding access, not app checkout access.

Non-secret product settings:

- `POLAR_QUARTERLY_PRODUCT_ID`
- `POLAR_SEMIANNUAL_PRODUCT_ID`
- `POLAR_APP_URL`: production-only trusted published origin, obtained from deployment metadata.
- `POLAR_LIVE_ENABLED`: production-only explicit checkout activation.

Product IDs have separate development and production values. Production never
falls back to sandbox credentials, and preview never selects live credentials.
Checkout validates product currency, price, interval and organization. Prices shown here
are plan prices; confirm Polar's tax settings before advertising final totals.

## After republishing

1. Confirm the published `/api/subscription/plans` reports `environment: "live"`
   and checkout enabled; preview must still report sandbox.
2. From a normal administrator login, run "Check Polar connection".
3. Send a non-payment lifecycle test event such as `subscription.updated` from the
   live webhook dashboard; require HTTP 202. Invalid signatures must return 403.
   Do not use a fabricated paid-order test to grant access: orders are always
   fetched from Polar and unknown orders are rejected.
4. Open each hosted live checkout and inspect the real USD terms without paying.
   A real-money transaction, refund, or cancellation is not authorized by these
   checks. The owner declined extra cancellation/refund testing.

Live delivery against the republished build has not yet been observed. The
already-published previous build still rejects live checkout until republished.

## Implemented payment invariants

1. Create server-owned hosted checkout sessions for a signed-in learner. Map the
   two app plan IDs to trusted products; never accept an amount or external user
   ID supplied by the client. Bind checkout to the authenticated learner.
2. Obtain the published app origin when configuring return and webhook URLs.
   Do not use the preview host as the live callback or trust arbitrary Host
   headers. Do not register a webhook URL until its receiver exists.
3. Verify incoming webhook signatures over the **original raw request bytes**
   with the current supported Polar SDK. Do not implement a guessed HMAC.
4. Persist provider order/subscription/event identifiers with database unique
   constraints. Process verified payments and entitlement writes atomically and
   idempotently so retries, concurrent deliveries and refreshes cannot extend
   access twice.
5. Grant access only after verified payment, never from a success-page query
   parameter or checkout-created event. Store the six-month expiry in the app.
   Preserve outstanding trial/paid access and administrator privileges.
6. Define and test recurring renewals, cancellation at paid-period end, failed
   payments, refunds and revocations. Keep payment failure from erasing unrelated
   paid access. Expose learner-owned status/history and a hosted management
   path for the recurring plan.
7. Add bilingual success, cancellation, pending-verification and failure states;
   refresh entitlement after confirmed payment. Do not collect card data here.
8. Run sandbox payment, renewal, duplicate/out-of-order webhook, invalid signature,
   wrong price/currency/product, wrong learner, and refund tests before enabling
   live checkout. Verify deployment schema and production callback configuration.

## Official references checked

- Products and interval counts: https://polar.sh/docs/features/products
- Hosted checkout: https://polar.sh/docs/features/checkout/session
- Signature verification: https://polar.sh/docs/integrate/webhooks/delivery

Polar SDKs and webhook signing have changed over time. Consult current official
docs again during implementation rather than copying an old signing recipe.
