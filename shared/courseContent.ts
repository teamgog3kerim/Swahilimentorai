// Adapt the imported grammar format without replacing lesson IDs or learner data.
const grammarRules: Array<{ prefix: string; english?: string; chinese: string; examplesChinese: string[] }> = [
  { prefix: "Present tense formed", chinese: "现在时结构：主语前缀 + na + 动词词根。例如 Ni-na-kula（我正在吃）。",
    examplesChinese: ["Ninakula = 我正在吃", "Unakula = 你正在吃", "Anakula = 他／她正在吃"] },
  { prefix: "Swahili time is", english: "Traditional Swahili clock time differs by six hours from the international clock. 7am = saa moja asubuhi (hour one), 1pm = saa saba mchana (hour seven). Confirm which clock system is intended when arranging a meeting.",
    chinese: "传统斯瓦希里计时与国际通用钟表相差六小时。上午7点为 saa moja asubuhi（第一小时），下午1点为 saa saba mchana（第七小时）。约定时间时，请确认双方使用哪种计时方式。",
    examplesChinese: ["上午7点 = Saa moja asubuhi", "下午1点 = Saa saba mchana", "晚上7点 = Saa moja jioni"] },
  { prefix: "Use 'tafadhali'", chinese: "礼貌请求可使用 tafadhali（请），较正式的请求可用 naomba（我请求）。",
    examplesChinese: ["Naomba maji = 我想要水（正式）", "Tafadhali nisaidie = 请帮助我", "Naweza kusaidia? = 我可以帮忙吗？"] },
  { prefix: "Possessives agree", chinese: "物主词须与所修饰名词的类别一致。不同名词类别使用不同形式的物主词。",
    examplesChinese: ["Kitabu changu（我的书）— ki/vi 类", "Gari langu（我的车）— ji/ma 类", "Nyumba yangu（我的房子）— n/n 类"] },
  { prefix: "Start yes/no", chinese: "一般疑问句可以用 Je 开头，或使用上升语调。回答用 Ndiyo（是）或 Hapana（不是）。",
    examplesChinese: ["Je, wewe ni mwalimu? = 你是老师吗？", "Unapenda kahawa? = 你喜欢咖啡吗？", "Ndiyo, napenda = 是的，我喜欢"] },
  { prefix: "Past tense uses", chinese: "过去时使用 li 标记：Ni-li-kula（我吃过了）。结构为主语前缀 + li + 动词词根。",
    examplesChinese: ["Nilikula = 我吃过了", "Ulikula = 你吃过了", "Alikula = 他／她吃过了", "Tulikula = 我们吃过了", "Mlikula = 你们吃过了", "Walikula = 他们吃过了"] },
  { prefix: "Future tense uses", chinese: "将来时使用 ta 标记：Ni-ta-kula（我将吃）。结构为主语前缀 + ta + 动词词根。",
    examplesChinese: ["Nitakula = 我将吃", "Utakula = 你将吃", "Atakula = 他／她将吃"] },
  { prefix: "Use 'kuliko'", chinese: "比较可以使用 kuliko：X ni kubwa kuliko Y（X 比 Y 大）。zaidi 表示更多。",
    examplesChinese: ["Gari langu ni kubwa kuliko lako = 我的车比你的大"] },
  { prefix: "Advanced business vocabulary", chinese: "商务用语需结合正式语体和具体的专业场景来使用。",
    examplesChinese: ["Tunapendekeza ushirikiano = 我们建议合作"] },
  { prefix: "Complex sentences use", chinese: "复杂句通过连词和关系从句连接不同的想法。",
    examplesChinese: ["Kitu ambacho nilikiona = 我看见的那个东西"] },
];

export function normalizeCourseContent(content: Record<string, any>, language: string, title?: string): Record<string, any> {
  // The imported lesson was labelled 1–20 but supplied only 1–10.
  if (language === "swahili" && title === "Numbers 1-20" && content?.vocabulary?.length === 10
    && content.vocabulary[0]?.english === "One" && content.vocabulary[9]?.english === "Ten") {
    const additionalNumbers = [
      ["Kumi na moja", "Eleven", "十一"], ["Kumi na mbili", "Twelve", "十二"],
      ["Kumi na tatu", "Thirteen", "十三"], ["Kumi na nne", "Fourteen", "十四"],
      ["Kumi na tano", "Fifteen", "十五"], ["Kumi na sita", "Sixteen", "十六"],
      ["Kumi na saba", "Seventeen", "十七"], ["Kumi na nane", "Eighteen", "十八"],
      ["Kumi na tisa", "Nineteen", "十九"], ["Ishirini", "Twenty", "二十"],
    ].map(([swahili, english, chinese]) => ({ swahili, english, chinese }));
    content = { ...content, vocabulary: [...content.vocabulary, ...additionalNumbers] };
  }
  if (language !== "swahili" || typeof content?.grammar?.rule !== "string") return content;
  const match = grammarRules.find((rule) => content.grammar.rule.startsWith(rule.prefix));
  if (!match) return content;
  return {
    ...content,
    grammar: {
      ...content.grammar,
      rule: match.english || content.grammar.rule,
      ruleChinese: content.grammar.ruleChinese || match.chinese,
      examples: (content.grammar.examples || []).map((example: string) => example.replace("Utak ula", "Utakula")),
      examplesChinese: content.grammar.examplesChinese || match.examplesChinese,
    },
  };
}
