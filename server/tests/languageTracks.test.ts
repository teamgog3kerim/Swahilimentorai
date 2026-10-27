import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";

test("Language APIs isolate curriculum, progress, and conversations while preserving Swahili defaults", {
  skip: process.env.RUN_HTTP_TESTS !== "1",
  timeout: 30_000,
}, async () => {
  const { storage } = await import("../storage");
  const { pool } = await import("../db");
  let id: string | undefined;
  try {
    const password = randomUUID();
    const user = await storage.createUserWithPassword(`tracks-test-${randomUUID()}@gmail.com`, "Temporary track learner", await bcrypt.hash(password, 10));
    id = user.id;
    const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    const anonymous = await fetch(`${base}/api/auth/user`);
    assert.equal(anonymous.status, 200);
    assert.equal(await anonymous.json(), null);
    assert.equal((await fetch(`${base}/api/lessons`)).status, 401);
    const malformed = await fetch(`${base}/api/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" }, body: "{invalid",
    });
    assert.equal(malformed.status, 400);
    assert.equal((await fetch(`${base}/api/auth/providers`)).status, 200, "Malformed requests must not crash the app");
    assert.equal((await fetch(`${base}/api/not-a-real-endpoint`)).status, 404);
    const login = await fetch(`${base}/api/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, password }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    const request = (path: string, body?: unknown) => fetch(`${base}${path}`, {
      method: body ? "POST" : "GET", headers: { cookie, "content-type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const swahili = await (await request("/api/lessons")).json();
    assert.equal(typeof (await (await request("/api/capabilities")).json()).aiTutorAvailable, "boolean");
    assert.equal(swahili.find((lesson: any) => lesson.title === "Numbers 1-20").content.vocabulary.length, 20);
    assert.match(swahili.find((lesson: any) => lesson.title === "Telling Time").content.grammar.rule, /six hours/);
    assert.ok(swahili.filter((lesson: any) => lesson.content.grammar).every((lesson: any) => lesson.content.grammar.ruleChinese));
    const amharic = await (await request("/api/lessons?language=amharic")).json();
    assert.ok(swahili.length >= 90);
    assert.ok(amharic.length >= 31);
    assert.ok(swahili.every((l: any) => l.language === "swahili"));
    assert.ok(amharic.every((l: any) => l.language === "amharic"));
    const beginner = await (await request("/api/lessons/level/beginner?language=amharic")).json();
    assert.ok(beginner.length > 0 && beginner.every((l: any) => l.level === "beginner" && l.language === "amharic"));
    const progress = await request("/api/progress", { lessonId: amharic[0].id, completed: true });
    assert.equal(progress.status, 200);
    assert.equal((await (await request("/api/progress?language=amharic")).json()).length, 1);
    assert.equal((await (await request("/api/progress?language=swahili")).json()).length, 0);
    const completeSwahili = await request("/api/progress", { lessonId: swahili[0].id, completed: true });
    assert.equal(completeSwahili.status, 200);
    assert.equal((await (await request("/api/progress?language=amharic")).json()).length, 1);
    assert.equal((await (await request("/api/progress")).json()).length, 1);
    assert.equal((await request("/api/progress", { lessonId: amharic[0].id, completed: false })).status, 200);
    assert.equal((await (await request("/api/progress?language=amharic")).json())[0].completed, false);
    const chat = await request("/api/chat/session", { language: "amharic", level: "beginner", lessonId: amharic[0].id });
    assert.equal(chat.status, 200);
    assert.equal((await chat.json()).language, "amharic");
    assert.equal((await (await request("/api/chat/sessions?language=amharic")).json()).length, 1);
    assert.equal((await (await request("/api/chat/sessions")).json()).length, 0);
    assert.equal((await request("/api/chat/session", { language: "swahili", level: "beginner", lessonId: amharic[0].id })).status, 400);
    assert.equal((await request("/api/chat/session", { language: "french", level: "beginner" })).status, 400);
    assert.equal((await request("/api/lessons?language=en")).status, 400);
    console.log("PASS: Amharic and Swahili curriculum, progress and chat history remain separate; invalid languages/cross-track lessons are rejected.");
  } finally {
    if (id) await storage.deleteManagedUser(id);
    await pool.end();
  }
});
