// Mandarin approximations are memory aids, not phonetic transcriptions.
const vowels = "aeiou";
const syllables: Record<string, string[]> = {
  b: ["巴", "贝", "比", "博", "布"], ch: ["查", "切", "奇", "乔", "楚"],
  d: ["达", "德", "迪", "多", "杜"], dh: ["扎", "泽", "齐", "佐", "祖"],
  f: ["法", "费", "菲", "佛", "夫"], g: ["嘎", "盖", "吉", "戈", "古"],
  gh: ["嘎", "盖", "吉", "戈", "古"], h: ["哈", "赫", "希", "霍", "胡"],
  j: ["加", "杰", "吉", "乔", "朱"], k: ["卡", "克", "基", "科", "库"],
  kh: ["卡", "克", "基", "科", "库"], l: ["拉", "莱", "利", "洛", "卢"],
  m: ["马", "梅", "米", "莫", "穆"], n: ["纳", "内", "尼", "诺", "努"],
  ng: ["恩嘎", "恩盖", "恩吉", "恩戈", "恩古"],
  "ng'": ["昂阿", "昂诶", "昂伊", "昂哦", "昂乌"],
  ny: ["聂亚", "聂耶", "尼", "聂约", "纽"], p: ["帕", "佩", "皮", "波", "普"],
  r: ["拉", "雷", "里", "罗", "鲁"], s: ["萨", "塞", "西", "索", "苏"],
  sh: ["沙", "谢", "希", "绍", "舒"], t: ["塔", "特", "提", "托", "图"],
  th: ["萨", "塞", "西", "索", "苏"], v: ["瓦", "韦", "维", "沃", "乌"],
  w: ["瓦", "韦", "维", "沃", "乌"], y: ["亚", "耶", "伊", "约", "尤"],
  z: ["扎", "泽", "齐", "佐", "祖"], c: ["卡", "克", "基", "科", "库"],
  q: ["卡", "克", "基", "科", "库"], x: ["克萨", "克塞", "克西", "克索", "克苏"],
};
const onsets = Object.keys(syllables).sort((a, b) => b.length - a.length);
const consonants: Record<string, string> = {
  b: "布", c: "克", d: "德", f: "夫", g: "格", h: "赫", j: "吉", k: "克",
  l: "勒", m: "姆", n: "恩", p: "普", q: "克", r: "尔", s: "斯", t: "特",
  v: "夫", w: "乌", x: "克斯", y: "伊", z: "兹",
};
const vowelReadings = ["阿", "诶", "伊", "哦", "乌"];
const commonWords: Record<string, string> = { asante: "阿·桑·特" };

export const chineseSwahiliReadingNote = "中文近似音仅供辅助记忆，并非准确音标。中文不能完全表示斯瓦希里语的元音、鼻音、辅音连缀和重音；不要把辅助汉字逐字读成额外的音节。请保留原文学习，有可用语音时配合聆听。";

export function chineseSwahiliReading(native: string): string {
  if (!new RegExp("\\p{Script=Latin}", "u").test(native)) return "";
  return native.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/’/g, "'")
    .replace(/[a-z]+(?:'[a-z]+)*/gi, (word) => {
      word = word.toLowerCase();
      if (commonWords[word]) return commonWords[word];
      const result: string[] = [];
      for (let position = 0; position < word.length;) {
        const vowel = vowels.indexOf(word[position]);
        if (vowel >= 0) {
          result.push(vowelReadings[vowel]);
          position++;
          continue;
        }
        const onset = onsets.find(key => word.startsWith(key, position) && vowels.includes(word[position + key.length] || "!"));
        if (onset) {
          result.push(syllables[onset][vowels.indexOf(word[position + onset.length])]);
          position += onset.length + 1;
        } else {
          result.push(consonants[word[position]] || "·");
          position++;
        }
      }
      return result.join("·");
    });
}
