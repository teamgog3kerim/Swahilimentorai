import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

test("each recorded visitor creates an admin alert without personal details", {
  skip: process.env.RUN_DB_TESTS !== "1",
}, async () => {
  const { storage } = await import("../storage");
  const { db, pool } = await import("../db");
  const { eq, sql } = await import("drizzle-orm");
  const { adminNotifications, visits } = await import("../../shared/schema");
  let visitId: string | undefined;

  try {
    const visit = await storage.createVisit({ sessionId: `test-${randomUUID()}` });
    visitId = visit.id;
    const notification = (await storage.getAllNotifications(1000))
      .find(item => item.metadata?.visitId === visit.id);

    assert.ok(notification);
    assert.equal(notification.type, "new_visitor");
    assert.deepEqual(notification.metadata, { visitId: visit.id });
    assert.equal(notification.isRead, false);
  } finally {
    if (visitId) {
      await db.delete(adminNotifications).where(
        sql`${adminNotifications.metadata}->>'visitId' = ${visitId}`,
      );
      await db.delete(visits).where(eq(visits.id, visitId));
    }
    await pool.end();
  }
});
