import { test } from "node:test";
import assert from "node:assert/strict";
import { checkTranslations, inspectDictionary, inspectTranslationCalls } from "../../scripts/check-translations";

const dictionary = (json: string) => `const translations = JSON.parse(String.raw\`${json}\`);`;

test("all client translation calls have non-empty English entries and dictionary keys are unique", () => {
  assert.deepEqual(checkTranslations(), []);
});

test("duplicate keys are reported before JSON.parse overwrites them, including escaped spellings", () => {
  const result = inspectDictionary(dictionary('{"课程":"Lessons","\\u8bfe程":"Courses"}'));
  assert.match(result.issues.join("\n"), /duplicate English key "课程".*first at/);
});

test("missing standalone Amharic translation reports the exact key and source location", () => {
  assert.deepEqual(inspectTranslationCalls('const label = t("阿姆哈拉语");', "Story.tsx", {}), [
    'Story.tsx:1:17: missing English entry "阿姆哈拉语"; add it to client/src/lib/i18n.tsx',
  ]);
});

test("conditional keys, empty values and Chinese English values cannot silently pass", () => {
  assert.equal(inspectTranslationCalls('t(amharic ? "阿姆哈拉语" : "斯瓦希里语")', "Course.tsx", {}).length, 2);
  const { issues } = inspectDictionary(dictionary('{"课程":"","练习":"练习"}'));
  assert.match(issues.join("\n"), /empty\/non-string English translation/);
  assert.match(issues.join("\n"), /English translation still contains Chinese/);
});

test("dynamic calls must become checkable literals; native teaching phrases are not missing interface keys", () => {
  assert.match(inspectTranslationCalls("t(story.label)", "Story.tsx", {}).join("\n"), /unchecked dynamic translation/);
  assert.deepEqual(inspectTranslationCalls('t("Habari!"); t("ሰላም"); t("Ethiopanda");', "Lesson.tsx", {}), []);
});

test("malformed dictionaries fail explicitly", () => {
  assert.throws(() => inspectDictionary(dictionary('{"课程":}')), SyntaxError);
});
