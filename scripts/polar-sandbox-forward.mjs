import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { createSandboxRelay } from "./lib/polar-sandbox-relay.mjs";

async function main() {
  if (process.env.NODE_ENV !== "development" || process.env.REPLIT_DEPLOYMENT === "1") {
    throw new Error("Forwarding is allowed only in development.");
  }
  if (!process.env.POLAR_CLI_ACCESS_TOKEN || !process.env.POLAR_ACCESS_TOKEN ||
    !process.env.POLAR_WEBHOOK_SECRET) {
    throw new Error("Sandbox forwarding requires the checkout, forwarding, and webhook secrets.");
  }
  const statusResponse = await fetch("http://127.0.0.1:5000/api/subscription/plans", {
    signal: AbortSignal.timeout(6000),
  });
  const status = await statusResponse.json();
  if (!statusResponse.ok || status.environment !== "sandbox" || !status.checkoutEnabled) {
    throw new Error("Start the sandbox app before starting the forwarder.");
  }
  const ids = [process.env.POLAR_QUARTERLY_PRODUCT_ID, process.env.POLAR_SEMIANNUAL_PRODUCT_ID];
  if (!ids.every(id => typeof id === "string" && /^[a-f0-9-]{36}$/i.test(id))) {
    throw new Error("Sandbox product IDs are not configured.");
  }
  const products = await Promise.all(ids.map(async id => {
    const response = await fetch(`https://sandbox-api.polar.sh/v1/products/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        "Polar-Version": "2026-10",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error("Sandbox product verification failed.");
    return response.json();
  }));
  const organizationId = products[0].organization_id;
  if (typeof organizationId !== "string" || organizationId !== products[1].organization_id) {
    throw new Error("The sandbox products must belong to the same organization.");
  }
  const relay = createSandboxRelay({
    appSecret: process.env.POLAR_WEBHOOK_SECRET,
    onResult: ({ type, status }) => console.log(`Sandbox forwarding: ${type} → HTTP ${status}`),
  });
  await new Promise((done, reject) => {
    relay.server.once("error", reject);
    // Ephemeral loopback port: not a public Replit workflow or preview port.
    relay.server.listen(0, "127.0.0.1", done);
  });
  const child = spawn(resolve("node_modules/.bin/polar"), [
    "webhook", "listen", `http://127.0.0.1:${relay.server.address().port}/polar-cli`,
    "--org", organizationId, "--json",
  ], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      TMPDIR: process.env.TMPDIR || "/tmp",
      NO_COLOR: "1",
      POLAR_ENVIRONMENT: "sandbox",
      POLAR_ACCESS_TOKEN: process.env.POLAR_CLI_ACCESS_TOKEN,
    },
  });
  const stop = (code = 0) => {
    relay.server.close();
    child.kill("SIGTERM");
    process.exitCode = code;
  };
  process.once("SIGINT", () => stop());
  process.once("SIGTERM", () => stop());
  child.once("error", () => {
    console.error("Sandbox forwarder could not start.");
    stop(1);
  });
  child.once("exit", (code) => {
    relay.server.close();
    process.exitCode = code || 0;
    console.log("Sandbox forwarder stopped.");
  });
  // Raw CLI output includes its signing key. Consume internally, never echo it.
  child.stderr.resume();
  const lines = createInterface({ input: child.stdout });
  lines.on("line", line => {
    try {
      const message = JSON.parse(line);
      if (message._tag === "Connected") {
        if (typeof message.secret !== "string" ||
          message.secret !== organizationId.replaceAll("-", "")) {
          console.error("Sandbox forwarding organization verification failed.");
          stop(1);
          return;
        }
        relay.setCliSecret(message.secret);
        console.log("Sandbox forwarder connected. Signed events are forwarded locally; secrets are hidden.");
      } else if (message.error) {
        console.error("Polar CLI rejected the sandbox forwarding connection. Check organizations:read and webhooks:read.");
      } else if (message._tag === "ForwardFailed") {
        console.error("Sandbox forwarding failed; the event has not been accepted.");
      }
    } catch {
      // Malformed output is intentionally not logged: it may contain a key.
    }
  });
}

main().catch(() => {
  console.error("Sandbox forwarder startup failed. Check app readiness, sandbox products, and forwarding permissions.");
  process.exitCode = 1;
});
