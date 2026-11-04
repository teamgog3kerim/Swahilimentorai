import { test } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { createCanonicalDomainRedirect } from "../canonicalDomain";

const production = {
  NODE_ENV: "production",
  GOOGLE_CALLBACK_URL: "https://ethiopanda.com/api/auth/google/callback",
} as NodeJS.ProcessEnv;

function requestRedirect(options: {
  host?: string;
  path?: string;
  method?: string;
  accept?: string;
  env?: NodeJS.ProcessEnv;
}) {
  let nextCalled = false;
  let destination: string | undefined;
  let cacheControl: string | undefined;
  const host = options.host ?? "swahilimentorai-1.replit.app";
  const path = options.path ?? "/api/auth/google?next=%2Fdashboard";
  const req = {
    hostname: host,
    method: options.method ?? "GET",
    path: new URL(path, "https://placeholder.test").pathname,
    originalUrl: path,
    get: (name: string) => name.toLowerCase() === "accept" ? options.accept ?? "text/html" : undefined,
  } as Request;
  const res = {
    set: (name: string, value: string) => { if (name === "Cache-Control") cacheControl = value; },
    redirect: (_status: number, url: string) => { destination = url; },
  } as unknown as Response;
  createCanonicalDomainRedirect(options.env ?? production)(req, res, () => { nextCalled = true; });
  return { nextCalled, destination, cacheControl };
}

test("browser page visits on the old Replit domain redirect to the primary domain", () => {
  const result = requestRedirect({ path: "/dashboard?tab=subscription" });
  assert.equal(result.destination, "https://ethiopanda.com/dashboard?tab=subscription");
  assert.equal(result.cacheControl, "no-store");
});

test("Google OAuth starts on the canonical host before creating its session", () => {
  const result = requestRedirect({});
  assert.equal(result.destination, "https://ethiopanda.com/api/auth/google?next=%2Fdashboard");
});

test("API requests and non-browser requests are not redirected", () => {
  for (const options of [
    { method: "POST" },
    { accept: "application/json" },
    { accept: "*/*" },
    { path: "//untrusted.test/path" },
    { path: "/\\untrusted.test/path" },
    { host: "ethiopanda.com" },
    { host: "preview.replit.dev" },
    { env: { ...production, NODE_ENV: "development" } as NodeJS.ProcessEnv },
  ]) {
    assert.equal(requestRedirect(options).nextCalled, true);
    assert.equal(requestRedirect(options).destination, undefined);
  }
});

test("invalid or Replit-hosted callbacks do not enable canonical redirects", () => {
  for (const callback of [
    "not a URL",
    "https://swahilimentorai-1.replit.app/api/auth/google/callback",
    "http://ethiopanda.com/api/auth/google/callback",
    "https://user@ethiopanda.com/api/auth/google/callback",
  ]) {
    const result = requestRedirect({ env: { ...production, GOOGLE_CALLBACK_URL: callback } as NodeJS.ProcessEnv });
    assert.equal(result.nextCalled, true);
    assert.equal(result.destination, undefined);
  }
});
