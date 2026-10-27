import { test } from "node:test";
import assert from "node:assert/strict";
import { isOwnerEmail, mayLinkGoogleAccount, verifiedGoogleProfile } from "../accountPolicy";

test("Google email ownership must be verified and belong to Gmail", () => {
  const claims = { sub: "google-subject", email: "learner@gmail.com", email_verified: true };
  assert.equal(verifiedGoogleProfile(claims).email, "learner@gmail.com");
  assert.throws(() => verifiedGoogleProfile({ ...claims, email_verified: false }));
  assert.throws(() => verifiedGoogleProfile({ ...claims, email_verified: "true" }));
  assert.throws(() => verifiedGoogleProfile({ ...claims, email: "untrusted@example.com" }));
  assert.throws(() => verifiedGoogleProfile({ ...claims, sub: undefined }));
});

test("Existing accounts require authentication before linking; Google subjects cannot be replaced", () => {
  const existing = { id: "existing-user", email: "learner@gmail.com", googleId: null };
  assert.equal(mayLinkGoogleAccount(existing, "new-google-subject"), false);
  assert.equal(mayLinkGoogleAccount(existing, "new-google-subject", "different-user"), false);
  assert.equal(mayLinkGoogleAccount(existing, "new-google-subject", existing.id), true);
  assert.equal(mayLinkGoogleAccount({ ...existing, googleId: "original" }, "replacement", existing.id), false);
});

test("Only the configured owner is eligible for verified Google bootstrap", () => {
  const previous = process.env.APP_OWNER_EMAIL;
  process.env.APP_OWNER_EMAIL = "owner-policy-test@gmail.com";
  try {
    assert.equal(isOwnerEmail("OWNER-POLICY-TEST@gmail.com"), true);
    assert.equal(isOwnerEmail("other@gmail.com"), false);
    assert.equal(mayLinkGoogleAccount({
      id: "owner", email: "owner-policy-test@gmail.com", googleId: null,
    }, "verified-owner-subject"), true);
    assert.equal(mayLinkGoogleAccount({
      id: "owner", email: "owner-policy-test@gmail.com", googleId: "original",
    }, "replacement"), false);
  } finally {
    if (previous === undefined) delete process.env.APP_OWNER_EMAIL;
    else process.env.APP_OWNER_EMAIL = previous;
  }
});
