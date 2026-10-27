import { test } from "node:test";
import assert from "node:assert/strict";
import { createTrialEndDate, FREE_TRIAL_MS, hasLearningAccess } from "../../shared/subscriptionAccess";

test("New trials last exactly 88 elapsed hours, independent of calendar boundaries", () => {
  const start = Date.parse("2026-10-31T23:30:00Z");
  assert.equal(FREE_TRIAL_MS, 88 * 60 * 60 * 1000);
  assert.equal(createTrialEndDate(start).getTime() - start, FREE_TRIAL_MS);
});

test("Access ends exactly at the stored expiry; admins and unlimited grants remain active", () => {
  const now = Date.parse("2026-10-27T12:00:00Z");
  const user = { isAdmin: false, isPremium: true, subscriptionEndsAt: createTrialEndDate(now) };
  assert.equal(hasLearningAccess(user, now), true);
  assert.equal(hasLearningAccess(user, now + FREE_TRIAL_MS - 1), true);
  assert.equal(hasLearningAccess(user, now + FREE_TRIAL_MS), false);
  assert.equal(hasLearningAccess({ ...user, isPremium: false }, now), false);
  assert.equal(hasLearningAccess({ ...user, subscriptionEndsAt: "invalid" }, now), false);
  assert.equal(hasLearningAccess({ ...user, subscriptionEndsAt: null }, now), true);
  assert.equal(hasLearningAccess({ ...user, isPremium: false, isAdmin: true }, now + FREE_TRIAL_MS), true);
  assert.equal(hasLearningAccess(null, now), false);
});

test("Existing issued and paid deadlines are authoritative and do not restart a trial", () => {
  const now = Date.now();
  const deadline = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(hasLearningAccess({ isAdmin: false, isPremium: true, subscriptionEndsAt: deadline }, now), true);
  assert.equal(hasLearningAccess({ isAdmin: false, isPremium: true, subscriptionEndsAt: deadline }, Date.parse(deadline)), false);
});
