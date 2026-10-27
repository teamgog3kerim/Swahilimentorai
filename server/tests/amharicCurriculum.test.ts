import { test } from "node:test";
import assert from "node:assert/strict";
import { amharicLessons } from "../curriculum/amharic";
import { fidelFamilies, labializedLetters } from "../curriculum/amharicAlphabet";

test("Amharic curriculum covers the complete basic Fidel, words, numbers and conversations bilingually", () => {
  assert.equal(fidelFamilies.length, 33);
  assert.ok(fidelFamilies.every(([row]) => Array.from(row).length === 7));
  assert.equal(new Set(fidelFamilies.flatMap(([row]) => Array.from(row))).size, 231);
  assert.ok(labializedLetters.length > 30);
  assert.equal(amharicLessons.length, 31);
  assert.deepEqual(Array.from(new Set(amharicLessons.map((l) => l.category))).sort(), ["conversations", "letters", "numbers", "words"]);
  assert.deepEqual(Array.from(new Set(amharicLessons.map((l) => l.level))).sort(), ["advanced", "beginner", "intermediate"]);
  assert.equal(amharicLessons.filter((l) => l.category === "conversations").length, 12);
  assert.equal(amharicLessons.filter((l) => l.category === "numbers").length, 3);
  for (const lesson of amharicLessons) {
    assert.equal(lesson.language, "amharic");
    assert.ok(lesson.title && lesson.titleChinese && lesson.titleSwahili);
    const content = lesson.content as any;
    assert.ok(content.introduction.english && content.introduction.chinese);
    assert.ok(content.notes.english && content.notes.chinese);
    assert.ok(content.quizzes.length > 0);
    for (const q of content.quizzes) {
      assert.ok(q.question.english && q.question.chinese);
      assert.ok(q.explanation.english && q.explanation.chinese);
      assert.ok(q.options.length >= 3);
      assert.equal(new Set(q.options).size, q.options.length);
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);
    }
    for (const entry of content.vocabulary || []) {
      assert.ok(/[\u1200-\u137f]/.test(entry.term));
      assert.ok(entry.transliteration && entry.english && entry.chinese);
    }
  }
});
