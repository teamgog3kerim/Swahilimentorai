import { test } from "node:test";
import assert from "node:assert/strict";
import { amharicLessons } from "../curriculum/amharic";
import { fidelFamilies, labializedLetters } from "../curriculum/amharicAlphabet";
import { normalizeCourseContent } from "../../shared/courseContent";
import { chineseAmharicReading } from "../../shared/amharicPronunciation";

const latin = new RegExp("\\p{Script=Latin}", "u");
test("Chinese pronunciation aids cover the complete Fidel and labialized syllables", () => {
  for (const [row] of fidelFamilies) {
    for (const letter of Array.from(row)) {
      const reading = chineseAmharicReading(letter);
      assert.ok(/[\u3400-\u9fff]/.test(reading), letter);
      assert.equal(latin.test(reading), false, letter);
    }
  }
  for (const [letter] of labializedLetters) assert.ok(/[\u3400-\u9fff]/.test(chineseAmharicReading(letter)), letter);
  assert.equal(chineseAmharicReading("ገበያ"), "格·伯·亚");
});

test("Every Amharic lesson localizes Chinese aids and instructions without changing English or saved content", () => {
  for (const lesson of amharicLessons) {
    const original = JSON.stringify(lesson.content);
    const normalized = normalizeCourseContent(lesson.content as Record<string, any>, "amharic");
    const walk = (value: any, source: any, path = "") => {
      if (!value || typeof value !== "object") return;
      if (typeof value.chinese === "string") assert.equal(latin.test(value.chinese), false, `${lesson.title} ${path}: ${value.chinese}`);
      if (typeof value.english === "string") assert.equal(value.english, source.english);
      if (value.transliteration) {
        assert.equal(value.transliteration, source.transliteration);
        assert.ok(value.pronunciationChinese, `${lesson.title} ${path}`);
        assert.equal(latin.test(value.pronunciationChinese), false, `${lesson.title} ${path}`);
      }
      Object.keys(source).forEach(key => walk(value[key], source[key], `${path}.${key}`));
    };
    walk(normalized, lesson.content);
    assert.equal(JSON.stringify(lesson.content), original);
    assert.deepEqual(normalizeCourseContent(normalized, "amharic"), normalized);
  }
});
