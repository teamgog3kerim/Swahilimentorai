import { createServer } from "node:http";
import { Webhook } from "standardwebhooks";

// Local-only adapter for Polar CLI's separate development signing key.
// Never disable or replace verification at the application's public endpoint.
export function createSandboxRelay({ appSecret, fetchImpl = fetch, onResult = () => {} }) {
  const appSigner = new Webhook(appSecret);
  let cliVerifier;
  const server = createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const reply = (status) => { res.writeHead(status); res.end(); };
    if (req.socket.remoteAddress !== "127.0.0.1") return reply(403);
    if (req.url !== "/polar-cli") return reply(404);
    if (req.method !== "POST") return reply(405);
    if (!cliVerifier) return reply(503);
    let body;
    let event;
    const headers = {
      "webhook-id": String(req.headers["webhook-id"] || ""),
      "webhook-timestamp": String(req.headers["webhook-timestamp"] || ""),
      "webhook-signature": String(req.headers["webhook-signature"] || ""),
    };
    try {
      const chunks = [];
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 1024 * 1024) {
          reply(413);
          req.resume();
          return;
        }
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks).toString("utf8");
      event = cliVerifier.verify(body, headers);
    } catch {
      return reply(403);
    }
    try {
      // Re-sign the verified, unchanged body in memory using the existing app
      // key. Both hops verify signatures; no keys or payloads are persisted.
      const timestamp = new Date(Number(headers["webhook-timestamp"]) * 1000);
      const response = await fetchImpl("http://127.0.0.1:5000/api/webhooks/polar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
          "webhook-signature": appSigner.sign(headers["webhook-id"], timestamp, body),
        },
        body,
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      });
      // Do not log customer details, identifiers, payloads, or provider output.
      onResult({
        type: event.type === "order.paid" || event.type === "order.refunded" ? event.type : "other",
        status: response.status,
      });
      await response.body?.cancel();
      reply(response.status);
    } catch {
      onResult({ type: "other", status: 502 });
      reply(502);
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return {
    server,
    // Polar CLI supplies a raw key; the dashboard secret is base64 encoded.
    setCliSecret(secret) { cliVerifier = new Webhook(secret, { format: "raw" }); },
  };
}
