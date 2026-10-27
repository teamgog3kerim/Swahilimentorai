import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { learnerStoryInputSchema, type LearnerStoryInput } from "../../shared/learnerStories";

const sample: LearnerStoryInput = {
  learningLanguage: "amharic",
  displayNameZh: "测试学员",
  displayNameEn: "Test learner",
  quoteZh: "这是自动测试内容，不是真实评价。",
  quoteEn: "Automated test content, not a real testimonial.",
  contextZh: "初学者",
  contextEn: "Beginner",
  privateContact: "private-test@example.invalid",
  consentRecord: "Automated test only: permission for both translations and public attribution.",
  consentGranted: false,
  approved: false,
  published: false,
};

test("Stories require bilingual content, a supported track and permission before approval/publication", () => {
  assert.equal(learnerStoryInputSchema.safeParse(sample).success, true);
  for (const invalid of [
    { ...sample, approved: true },
    { ...sample, published: true },
    { ...sample, approved: true, consentGranted: true, consentRecord: " " },
    { ...sample, quoteEn: " " },
    { ...sample, displayNameZh: "" },
    { ...sample, learningLanguage: "other" },
    { ...sample, isVerified: true },
  ]) assert.equal(learnerStoryInputSchema.safeParse(invalid).success, false);
  assert.equal(learnerStoryInputSchema.safeParse({ ...sample, consentGranted: true, approved: true, published: true }).success, true);
});

test("Story APIs enforce admin access, publication gates, persistence and public privacy", {
  skip: process.env.RUN_HTTP_TESTS !== "1",
}, async () => {
  const { storage } = await import("../storage");
  const { pool } = await import("../db");
  const userIds: string[] = [];
  const storyIds: string[] = [];
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  let adminHeaders: Record<string, string> = {};
  try {
    const password = randomUUID();
    const cookies: string[] = [];
    for (const isAdmin of [true, false]) {
      const user = await storage.createUserWithPassword(`story-test-${randomUUID()}@example.invalid`, "Test only", await bcrypt.hash(password, 10));
      userIds.push(user.id);
      if (isAdmin) await storage.updateManagedUser(user.id, { username: user.username, isAdmin: true, isPremium: false, subscriptionEndsAt: null });
      const login = await fetch(`${base}/api/auth/login`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: user.email, password }),
      });
      assert.equal(login.status, 200);
      const cookie = login.headers.get("set-cookie")?.split(";")[0];
      assert.ok(cookie);
      cookies.push(cookie);
    }
    adminHeaders = { cookie: cookies[0], "content-type": "application/json" };
    const request = (path: string, method = "GET", body?: unknown, headers = adminHeaders) =>
      fetch(`${base}${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
    const adminPath = "/api/admin/learner-stories";
    for (const [headers, status] of [[{}, 401], [{ cookie: cookies[1], "content-type": "application/json" }, 403]] as const) {
      for (const [path, method, body] of [
        [adminPath, "GET", undefined],
        [adminPath, "POST", sample],
        [`${adminPath}/${randomUUID()}`, "PATCH", sample],
        [`${adminPath}/${randomUUID()}`, "DELETE", undefined],
      ] as const) assert.equal((await request(path, method, body, headers)).status, status);
    }
    const publicList = async () => {
      const response = await request("/api/learner-stories", "GET", undefined, {});
      assert.equal(response.status, 200);
      assert.match(response.headers.get("cache-control") || "", /no-store/);
      const stories = await response.json();
      const publicKeys = ["id", "learningLanguage", "displayNameZh", "displayNameEn", "quoteZh", "quoteEn", "contextZh", "contextEn"].sort();
      for (const story of stories) assert.deepEqual(Object.keys(story).sort(), publicKeys);
      return stories as { id: string; learningLanguage: string; quoteEn: string }[];
    };
    for (const learningLanguage of ["amharic", "swahili"] as const) {
      const input = { ...sample, learningLanguage };
      const created = await request(adminPath, "POST", input);
      assert.equal(created.status, 201);
      const story = await created.json();
      storyIds.push(story.id);
      const path = `${adminPath}/${story.id}`;
      assert.ok(!(await publicList()).some(s => s.id === story.id));
      assert.equal((await request(path, "PATCH", { ...input, approved: true, published: true })).status, 400);
      const approved = { ...input, consentGranted: true, approved: true };
      const consentChanged = await request(path, "PATCH", approved);
      assert.equal(consentChanged.status, 200);
      assert.equal((await consentChanged.json()).approved, false);
      assert.ok(!(await publicList()).some(s => s.id === story.id));
      const published = { ...approved, published: true };
      assert.equal((await request(path, "PATCH", published)).status, 200);
      assert.equal((await publicList()).find(s => s.id === story.id)?.learningLanguage, learningLanguage);
      assert.equal((await request(path, "PATCH", { ...published, consentRecord: " " })).status, 400);
      const edited = { ...published, quoteEn: "Edited automated test content." };
      const editedResponse = await request(path, "PATCH", edited);
      assert.equal(editedResponse.status, 200);
      const savedEdit = await editedResponse.json();
      assert.equal(savedEdit.approved, false);
      assert.equal(savedEdit.published, false);
      assert.ok(!(await publicList()).some(s => s.id === story.id));
      // Only a subsequent, unchanged-content approval may publish the edited story.
      assert.equal((await request(path, "PATCH", edited)).status, 200);
      assert.equal((await publicList()).find(s => s.id === story.id)?.quoteEn, edited.quoteEn);
      let latest = edited;
      for (const update of [
        { displayNameEn: "Updated approved attribution" },
        { quoteZh: "修改后的测试故事。" },
        { contextEn: "Updated context" },
        { learningLanguage: learningLanguage === "amharic" ? "swahili" as const : "amharic" as const },
        { consentRecord: "Updated automated permission notes" },
      ]) {
        latest = { ...latest, ...update };
        const result = await request(path, "PATCH", latest);
        assert.equal(result.status, 200);
        const changed = await result.json();
        assert.equal(changed.approved, false);
        assert.equal(changed.published, false);
        assert.ok(!(await publicList()).some(s => s.id === story.id));
        assert.equal((await request(path, "PATCH", latest)).status, 200);
        assert.ok((await publicList()).some(s => s.id === story.id));
      }
      // Restore the edited version privately, then explicitly reapprove.
      await request(path, "PATCH", edited);
      await request(path, "PATCH", edited);
      assert.equal((await request(path, "PATCH", { ...edited, published: false })).status, 200);
      assert.ok(!(await publicList()).some(s => s.id === story.id));
      assert.equal((await request(path, "PATCH", edited)).status, 200);
      assert.equal((await request(path, "PATCH", { ...input, consentGranted: false, approved: false, published: false })).status, 200);
      assert.ok(!(await publicList()).some(s => s.id === story.id));
      const adminList = await request(adminPath);
      assert.match(adminList.headers.get("cache-control") || "", /private, no-store/);
      assert.equal((await adminList.json()).find((s: { id: string }) => s.id === story.id).privateContact, input.privateContact);
      assert.equal((await request(path, "DELETE")).status, 204);
      assert.equal((await request(path, "PATCH", input)).status, 404);
      assert.equal((await request(path, "DELETE")).status, 404);
    }
  } finally {
    for (const id of storyIds) await storage.deleteLearnerStory(id);
    for (const id of userIds) await storage.deleteManagedUser(id);
    await pool.end();
  }
});
