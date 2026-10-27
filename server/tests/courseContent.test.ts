import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeCourseContent } from "../../shared/courseContent";

test("Imported grammar corrections are bilingual, non-destructive and idempotent", () => {
  const original = {
    grammar: {
      rule: "Swahili time is 12 hours ahead/behind Western time. 7am = saa moja (hour one), 1pm = saa saba (hour seven)",
      examples: ["7:00 AM = Saa moja asubuhi", "1:00 PM = Saa saba mchana", "7:00 PM = Saa moja jioni"],
    },
  };
  const before = JSON.stringify(original);
  const corrected = normalizeCourseContent(original, "swahili");
  assert.match(corrected.grammar.rule, /six hours/);
  assert.match(corrected.grammar.ruleChinese, /六小时/);
  assert.equal(corrected.grammar.examplesChinese.length, 3);
  assert.equal(JSON.stringify(original), before);
  assert.deepEqual(normalizeCourseContent(corrected, "swahili"), corrected);
  assert.equal(normalizeCourseContent(original, "amharic"), original);
  const future = normalizeCourseContent({
    grammar: { rule: "Future tense uses 'ta' marker", examples: ["Nitakula", "Utak ula = You will eat", "Atakula"] },
  }, "swahili");
  assert.equal(future.grammar.examples[1], "Utakula = You will eat");
});

test("Numbers 1–20 includes twenty distinct bilingual numbers without duplicates", () => {
  const english = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  const original = { vocabulary: english.map((word) => ({ swahili: word, english: word, chinese: word })) };
  const corrected = normalizeCourseContent(original, "swahili", "Numbers 1-20");
  assert.equal(original.vocabulary.length, 10);
  assert.equal(corrected.vocabulary.length, 20);
  assert.equal(corrected.vocabulary[19].swahili, "Ishirini");
  assert.deepEqual(normalizeCourseContent(corrected, "swahili", "Numbers 1-20"), corrected);
  const lowercase = { vocabulary: english.map(word => ({ swahili: word.toLowerCase(), english: word.toLowerCase(), chinese: word })) };
  assert.equal(normalizeCourseContent(lowercase, "swahili", "Numbers 1-20").vocabulary.length, 20);
});
