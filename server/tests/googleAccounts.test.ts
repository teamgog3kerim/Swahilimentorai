import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

test("Google accounts preserve existing data, enforce linking, and support managed deletion", {
  skip: process.env.RUN_DB_TESTS !== "1",
}, async () => {
  const { storage } = await import("../storage");
  const { pool } = await import("../db");
  const suffix = randomUUID();
  const ids = new Set<string>();
  const previousOwner = process.env.APP_OWNER_EMAIL;
  try {
    const profile = { googleId: `test-${suffix}`, email: `test-${suffix}@gmail.com`, username: "Test learner", profileImageUrl: null };
    const created = await storage.signInWithGoogle(profile);
    ids.add(created.id);
    assert.equal(created.isAdmin, false);
    assert.equal(created.authProvider, "google");
    assert.equal((await storage.signInWithGoogle(profile)).id, created.id);
    const emailUser = await storage.createUserWithPassword(`email-${suffix}@gmail.com`, "Existing learner", "not-a-real-password-hash");
    ids.add(emailUser.id);
    const linking = { ...profile, googleId: `linked-${suffix}`, email: emailUser.email };
    await assert.rejects(storage.signInWithGoogle(linking), /link_required/);
    const linked = await storage.signInWithGoogle(linking, emailUser.id);
    assert.equal(linked.id, emailUser.id);
    assert.equal(linked.passwordHash, emailUser.passwordHash);
    await assert.rejects(storage.signInWithGoogle({ ...profile, email: `wrong-${suffix}@gmail.com` }, emailUser.id), /email_mismatch/);

    process.env.APP_OWNER_EMAIL = `owner-${suffix}@gmail.com`;
    const owner = await storage.createUserWithPassword(process.env.APP_OWNER_EMAIL, "Owner test", "unverified-password-hash");
    ids.add(owner.id);
    const verifiedOwner = await storage.signInWithGoogle({ ...profile, googleId: `owner-${suffix}`, email: owner.email });
    assert.equal(verifiedOwner.isAdmin, true);
    assert.equal(verifiedOwner.passwordHash, null);
    assert.equal(verifiedOwner.subscriptionEndsAt, null);

    const session = await storage.createChatSession({ userId: created.id, level: "beginner" });
    await storage.createChatMessage({ sessionId: session.id, role: "user", content: "test" });
    await storage.updateManagedUser(created.id, { username: "Updated learner", isAdmin: false, isPremium: false, subscriptionEndsAt: null });
    assert.equal((await storage.getUser(created.id))?.username, "Updated learner");
    await storage.deleteManagedUser(created.id);
    ids.delete(created.id);
    assert.equal(await storage.getUser(created.id), undefined);
    assert.equal((await storage.getChatMessages(session.id)).length, 0);
  } finally {
    if (previousOwner === undefined) delete process.env.APP_OWNER_EMAIL;
    else process.env.APP_OWNER_EMAIL = previousOwner;
    for (const id of ids) await storage.deleteManagedUser(id);
    await pool.end();
  }
});
