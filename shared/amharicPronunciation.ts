// Chinese characters are approximate memory aids, not phonetic transcriptions.
// They cannot encode Amharic ejectives, gemination or all vowel distinctions.
const families = [
  ["ሀ", "h", "赫 胡 希 哈 黑 赫 霍"], ["ለ", "l", "勒 鲁 利 拉 雷 勒 洛"],
  ["ሐ", "ḥ", "赫 胡 希 哈 黑 赫 霍"], ["መ", "m", "么 穆 米 马 梅 姆 莫"],
  ["ሠ", "ś", "瑟 苏 西 萨 塞 斯 索"], ["ረ", "r", "勒 鲁 利 拉 雷 尔 罗"],
  ["ሰ", "s", "瑟 苏 西 萨 塞 斯 索"], ["ሸ", "sh", "舍 舒 希 沙 谢 什 绍"],
  ["ቀ", "q", "克 库 基 卡 凯 克 科"], ["በ", "b", "伯 布 比 巴 贝 布 波"],
  ["ተ", "t", "特 图 提 塔 特 特 托"], ["ቸ", "ch", "切 楚 奇 查 切 赤 乔"],
  ["ኀ", "ḫ", "赫 胡 希 哈 黑 赫 霍"], ["ነ", "n", "讷 努 尼 纳 内 恩 诺"],
  ["ኘ", "ny", "涅 纽 尼 聂亚 聂耶 聂 聂约"], ["አ", "", "阿 乌 伊 阿 埃 厄 哦"],
  ["ከ", "k", "克 库 基 卡 凯 克 科"], ["ኸ", "kh", "赫 胡 希 哈 黑 赫 霍"],
  ["ወ", "w", "沃 乌 威 瓦 韦 沃 沃"], ["ዐ", "ʿ", "阿 乌 伊 阿 埃 厄 哦"],
  ["ዘ", "z", "泽 祖 齐 扎 泽 兹 佐"], ["ዠ", "zh", "热 茹 日 扎 热 日 若"],
  ["የ", "y", "耶 尤 伊 亚 耶 伊 约"], ["ደ", "d", "德 杜 迪 达 德 德 多"],
  ["ጀ", "j", "杰 朱 吉 贾 杰 吉 乔"], ["ገ", "g", "格 古 吉 嘎 给 格 戈"],
  ["ጠ", "ṭ", "特 图 提 塔 特 特 托"], ["ጨ", "chʼ", "切 楚 奇 查 切 赤 乔"],
  ["ጰ", "pʼ", "珀 普 皮 帕 佩 普 波"], ["ጸ", "tsʼ", "策 促 齐 察 策 次 措"],
  ["ፀ", "ṣ", "策 促 齐 察 策 次 措"], ["ፈ", "f", "弗 富 菲 法 费 夫 佛"],
  ["ፐ", "p", "珀 普 皮 帕 佩 普 波"],
];
const extra = [
  ["ቈ", "qwä", "阔"], ["ቊ", "qwi", "奎"], ["ቋ", "qwa", "夸"], ["ቌ", "qwe", "奎耶"], ["ቍ", "qwə", "阔"],
  ["ኈ", "hwä", "霍"], ["ኊ", "hwi", "惠"], ["ኋ", "hwa", "华"], ["ኌ", "hwe", "惠耶"], ["ኍ", "hwə", "霍"],
  ["ኰ", "kwä", "阔"], ["ኲ", "kwi", "奎"], ["ኳ", "kwa", "夸"], ["ኴ", "kwe", "奎耶"], ["ኵ", "kwə", "阔"],
  ["ጐ", "gwä", "果"], ["ጒ", "gwi", "归"], ["ጓ", "gwa", "瓜"], ["ጔ", "gwe", "归耶"], ["ጕ", "gwə", "果"],
  ["ሏ", "lwa", "鲁瓦"], ["ሟ", "mwa", "姆瓦"], ["ሯ", "rwa", "鲁瓦"], ["ሷ", "swa", "斯瓦"], ["ሿ", "shwa", "什瓦"],
  ["ቧ", "bwa", "布瓦"], ["ቷ", "twa", "图瓦"], ["ቿ", "chwa", "楚瓦"], ["ኗ", "nwa", "努瓦"], ["ኟ", "nywa", "聂瓦"],
  ["ዟ", "zwa", "兹瓦"], ["ዧ", "zhwa", "日瓦"], ["ዷ", "dwa", "杜瓦"], ["ጇ", "jwa", "朱瓦"], ["ጧ", "ṭwa", "图瓦"],
  ["ጯ", "chʼwa", "楚瓦"], ["ጿ", "tsʼwa", "次瓦"], ["ፏ", "fwa", "夫瓦"], ["ፗ", "pwa", "普瓦"],
];
const readings = new Map<string, string>();
const letterReadings = new Map<string, string>();
const latinReadings = new Map<string, string>();
const orders = ["ä", "u", "i", "a", "e", "ə", "o"];
const orderNames = ["一", "二", "三", "四", "五", "六", "七"];
families.forEach(([first, stem, chinese]) => {
  chinese.split(" ").forEach((reading, index) => {
    if (["q", "ṭ", "chʼ", "pʼ", "tsʼ", "ṣ"].includes(stem)) reading += "（挤喉）";
    const character = String.fromCodePoint(first.codePointAt(0)! + index);
    const detailed = `${reading}（第${orderNames[index]}序）`;
    readings.set(character, reading);
    letterReadings.set(character, detailed);
    latinReadings.set(`${stem}${orders[index]}`, detailed);
  });
});
extra.forEach(([character, latin, chinese]) => {
  if (/^(q|ṭ|chʼ|tsʼ)/.test(latin)) chinese += "（挤喉）";
  readings.set(character, chinese);
  latinReadings.set(latin, chinese);
});

export function chineseAmharicReading(native: string, isLetter = false): string {
  if (isLetter && letterReadings.has(native)) return letterReadings.get(native)!;
  if (!Array.from(native).some(character => readings.has(character))) return "";
  const punctuation: Record<string, string> = { "።": "。", "፣": "，", "፤": "；", "፡": " " };
  return native.split(/(\s+|[።፣፤፡!?.,;:])/).map(part => {
    if (punctuation[part]) return punctuation[part];
    if (/^\s+$/.test(part) || /^[!?.,;:]$/.test(part)) return part;
    return Array.from(part).map(character => readings.get(character) || character).join("·");
  }).join("");
}

export const chineseReadingNote = "中文近似音仅供辅助记忆，不能完全表示阿姆哈拉语的元音、重音和辅音延长。第六序元音可能弱读或不发音；ቀ、ጠ、ጨ、ጰ、ጸ 等字母还涉及挤喉音。请结合原文学习，有可用语音时再配合聆听练习。";

// Adapt existing saved lessons at read time; do not rewrite IDs or progress.
export function normalizeAmharicPronunciation(content: Record<string, any>): Record<string, any> {
  const replacements = new Map(latinReadings);
  replacements.set("Li", "小李");
  replacements.set("Hana", "哈娜");
  replacements.set("haya and", chineseAmharicReading("ሃያ አንድ"));
  const collect = (value: any) => {
    if (!value || typeof value !== "object") return;
    const native = value.term || value.character || value.swahili;
    if (typeof native === "string" && typeof value.transliteration === "string") {
      const reading = value.pronunciationChinese || chineseAmharicReading(native, !!value.character);
      if (reading) replacements.set(value.transliteration, reading);
    }
    Object.values(value).forEach(collect);
  };
  collect(content);
  const pattern = Array.from(replacements.keys()).sort((a, b) => b.length - a.length)
    .map(key => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const expression = new RegExp(`(?<![A-Za-zÀ-žəʿʼ])(?:${pattern})(?![A-Za-zÀ-žəʿʼ])`, "g");
  const visit = (value: any, key = ""): any => {
    if (typeof value === "string" && key === "chinese") {
      if (value.startsWith("埃塞俄比亚文字从左向右书写。")) return chineseReadingNote;
      return value.replace(expression, match => replacements.get(match)!)
        .replace("对照转写", "对照中文近似音");
    }
    if (Array.isArray(value)) {
      const result = value.map(item => visit(item));
      return result.some((item, index) => item !== value[index]) ? result : value;
    }
    if (!value || typeof value !== "object") return value;
    const result: Record<string, any> = {};
    let changed = false;
    Object.entries(value).forEach(([childKey, child]) => {
      result[childKey] = visit(child, childKey);
      if (result[childKey] !== child) changed = true;
    });
    const native = value.term || value.character || value.swahili;
    if (typeof native === "string" && !value.pronunciationChinese) {
      const reading = chineseAmharicReading(native, !!value.character);
      if (reading) {
        result.pronunciationChinese = reading;
        changed = true;
      }
    }
    return changed ? result : value;
  };
  return visit(content);
}
