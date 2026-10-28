import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { Webhook } from "standardwebhooks";
import { createSandboxRelay } from "../../scripts/lib/polar-sandbox-relay.mjs";

test("CLI relay rejects unsigned/stale requests and re-signs unchanged verified payloads", async () => {
  const appSecret = randomBytes(32).toString("base64");
  const cliSecret = randomBytes(24).toString("hex");
  const cliSigner = new Webhook(cliSecret, { format: "raw" });
  const body = JSON.stringify({ type: "order.paid", data: { id: randomUUID() } });
  let forwarded = 0;
  let receiverStatus = 202;
  const relay = createSandboxRelay({
    appSecret,
    fetchImpl: async (url, options) => {
      assert.equal(url, "http://127.0.0.1:5000/api/webhooks/polar");
      assert.equal(options.body, body);
      assert.equal(options.redirect, "error");
      assert.deepEqual(new Webhook(appSecret).verify(options.body, options.headers), JSON.parse(body));
      forwarded++;
      return new Response(null, { status: receiverStatus });
    },
  });
  await new Promise(resolve => relay.server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${relay.server.address().port}/polar-cli`;
  const send = async (timestamp = new Date(), signature = true) => {
    const id = randomUUID();
    return fetch(url, {
      method: "POST", body,
      headers: {
        "webhook-id": id,
        "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
        "webhook-signature": signature ? cliSigner.sign(id, timestamp, body) : "invalid",
      },
    });
  };
  try {
    assert.equal((await send()).status, 503);
    relay.setCliSecret(cliSecret);
    assert.equal((await send(new Date(), false)).status, 403);
    assert.equal((await send(new Date(Date.now() - 600000))).status, 403);
    assert.equal(forwarded, 0);
    assert.equal((await send()).status, 202);
    assert.equal(forwarded, 1);
    receiverStatus = 503;
    assert.equal((await send()).status, 503);
    assert.equal((await fetch(url)).status, 405);
    assert.equal((await fetch(`${url}/other`, { method: "POST" })).status, 404);
    assert.equal(relay.server.address().address, "127.0.0.1");
  } finally {
    relay.server.closeAllConnections();
    await new Promise(resolve => relay.server.close(resolve));
  }
});
