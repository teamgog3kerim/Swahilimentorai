import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";

test("Admin APIs manage users, redact secrets, and prevent self-lockout", {
  skip: process.env.RUN_HTTP_TESTS !== "1",
}, async () => {
  const { storage } = await import("../storage");
  const { pool } = await import("../db");
  const ids = new Set<string>();
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  try {
    const password = randomUUID();
    const admin = await storage.createUserWithPassword(`admin-test-${randomUUID()}@gmail.com`, "Temporary admin", await bcrypt.hash(password, 10));
    ids.add(admin.id);
    await storage.updateManagedUser(admin.id, {
      username: admin.username, isAdmin: true, isPremium: false, subscriptionEndsAt: null,
    });
    const target = await storage.createUserWithPassword(`target-test-${randomUUID()}@gmail.com`, "Temporary learner", "not-a-real-password");
    ids.add(target.id);
    const login = await fetch(`${base}/api/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: admin.email, password }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    const headers = { cookie, "content-type": "application/json" };
    const request = (path: string, method = "GET", body?: unknown) =>
      fetch(`${base}${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });

    const response = await request("/api/admin/users");
    assert.equal(response.status, 200);
    const records = await response.json();
    assert.ok(records.length >= 2);
    assert.ok(records.every((record: object) => !("passwordHash" in record) && !("googleId" in record)));
    const details = { username: "Updated through admin API", isAdmin: false, isPremium: true, subscriptionEndsAt: null };
    assert.equal((await request(`/api/admin/users/${target.id}`, "PATCH", details)).status, 200);
    assert.equal((await storage.getUser(target.id))?.username, details.username);
    assert.equal((await request(`/api/admin/users/${admin.id}`, "PATCH", details)).status, 403);
    assert.equal((await request(`/api/admin/users/${admin.id}`, "DELETE")).status, 403);
    assert.equal((await request(`/api/admin/users/${target.id}`, "PATCH", { ...details, email: "cannot-change@example.com" })).status, 400);
    assert.equal((await request(`/api/admin/users/${target.id}`, "DELETE")).status, 204);
    assert.equal(await storage.getUser(target.id), undefined);
    ids.delete(target.id);
  } finally {
    for (const id of ids) await storage.deleteManagedUser(id);
    await pool.end();
  }
});
