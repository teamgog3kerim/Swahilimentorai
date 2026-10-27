import { test } from "node:test";
import assert from "node:assert/strict";
import { chineseSwahiliReading } from "../../shared/swahiliPronunciation";
import { readFileSync } from "node:fs";

test("Swahili practice reading aids use Chinese characters, including consonant clusters and quick replies", () => {
  const latin = new RegExp("\\p{Script=Latin}", "u");
  assert.equal(chineseSwahiliReading("Habari!"), "哈·巴·里!");
  assert.equal(chineseSwahiliReading("Asante sana"), "阿·桑·特 萨·纳");
  for (const native of ["Ndiyo", "Hapana", "Tafadhali", "Sijui", "Kiswahili", "ng'ombe", "nyumba", "chakula", "Shikamoo", "mbili", "dhahabu"]) {
    const guide = chineseSwahiliReading(native);
    assert.ok(/[\u3400-\u9fff]/.test(guide), native);
    assert.equal(latin.test(guide), false, `${native}: ${guide}`);
  }
  assert.equal(chineseSwahiliReading("123"), "");
});

test("Chinese AI practice requests Chinese sound aids while English retains Latin transliteration", () => {
  const source = readFileSync(new URL("../routes.ts", import.meta.url), "utf8");
  const start = source.indexOf("const systemPrompt = responseLanguage");
  const end = source.indexOf("// Build messages array", start);
  const prompt = source.slice(start, end);
  assert.ok(prompt.includes("For Amharic, include Ethiopic script and Latin transliteration."));
  assert.ok(prompt.includes("为原文提供中文汉字近似读音"));
  assert.ok(prompt.includes("不要用拉丁字母、拼音或罗马字转写"));
  assert.ok(!prompt.includes("需提供埃塞俄比亚文字和拉丁字母转写"));
});
