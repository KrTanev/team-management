# be-webhooks — Signed outgoing webhooks

**Type:** Build · **Track:** backend · **Needs:** be-api-design

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json` — task updates.

Integrations want to hear about task status changes. Send a webhook without slowing the request down and without letting receivers be spoofed.

**Done when (checked by the BetterDev check):**
- When `WEBHOOK_URL` is set, every task status change `POST`s JSON `{event: "task.status_changed", taskId, projectId, from, to, occurredAt}` to it (see `webhooks` in `contracts/openapi.yaml`); an update that doesn't change the status sends nothing
- Header `X-Signature: sha256=<hex>` = HMAC-SHA256 of the raw body with `WEBHOOK_SECRET`
- The API response doesn't wait for the webhook (a receiver that sleeps 5 s doesn't make `PATCH` slow — the check allows 2 s)
- A `5xx` from the receiver is retried up to 3 times (4 attempts in total) with exponential backoff — first retry within 2 s, every retry within 15 s, each wait longer than the previous one; a `4xx` is not retried; a retry that gets a `2xx` ends it
- Header `X-Delivery-Id` stays the same across retries of one event and differs between events

The check runs your server with `WEBHOOK_URL=http://127.0.0.1:8791/hook` and `WEBHOOK_SECRET=bd-check-secret`, and a receiver on that port.

Run it from **Actions → BetterDev check** with milestone `be-webhooks`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
