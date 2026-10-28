# Polar.sh integration handoff

## Current status

The app is usable for account creation, the 88-hour trial, and learning within
existing access periods. **It is not accepting payments.** No Polar SDK,
provider checkout, webhook receiver, or payment synchronization is implemented.
Adding configuration values alone intentionally does not enable checkout.

Administrators can open the Subscription screen to see the readiness checklist.
The checklist only reports whether settings exist; it never verifies a token
or returns its value. The new authenticated checkout contract rejects unknown
plans and browser-supplied prices, products, users, and redirect URLs, and
returns HTTP 503 until the actual integration is built.

## Exact products to connect later

| App plan | USD amount | Polar product | App access |
| --- | --- | --- | --- |
| quarterly | 88.00 (8800 cents) | Fixed recurring, month interval, count 3 | Every paid three-month period |
| semiannual | 168.00 (16800 cents) | Fixed one-time purchase | Six months, not lifetime |

Both cover all Amharic and Swahili courses. Six-month access is one payment,
not an automatically renewing six-month subscription. Polar's default lifetime
one-time benefit must not become lifetime app access.

## Configuration names reserved by this project

Set secrets only through workspace Secrets, never source files or chat:

- `POLAR_ACCESS_TOKEN`: least-privilege organization API access.
- `POLAR_WEBHOOK_SECRET`: signing secret for the configured webhook endpoint.

Non-secret product settings:

- `POLAR_QUARTERLY_PRODUCT_ID`
- `POLAR_SEMIANNUAL_PRODUCT_ID`

Do not mix sandbox product IDs and tokens with live ones. A future implementation
must explicitly select the environment and validate actual product currency,
price, interval and organization before enabling checkout. Prices shown here
are plan prices; confirm Polar's tax settings before advertising final totals.

## Required implementation before enabling payments

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
