import { db } from "../server/db";
import { lessons } from "../shared/schema";

const moreLessons = [
  // INTERMEDIATE LEVEL CONTINUED - MONTH 4-5 (Weeks 13-20)
  {
    level: "intermediate",
    title: "Future Tense",
    titleSwahili: "Wakati Ujao",
    titleChinese: "将来时",
    category: "Grammar",
    estimatedMinutes: 35,
    orderIndex: 34,
    content: {
      vocabulary: [
        { swahili: "kesho", chinese: "明天", english: "tomorrow", pronunciation: "KEH-shoh" },
        { swahili: "kesho kutwa", chinese: "后天", english: "day after tomorrow", pronunciation: "KEH-shoh KOOT-wa" },
        { swahili: "wiki ijayo", chinese: "下周", english: "next week", pronunciation: "WEE-kee ee-JA-yo" }
      ],
      phrases: [
        { swahili: "Nitakula kesho", chinese: "我明天会吃", english: "I will eat tomorrow", pronunciation: "nee-ta-KOO-la KEH-shoh" },
        { swahili: "Tutakwenda Dar", chinese: "我们会去达累斯萨拉姆", english: "We will go to Dar", pronunciation: "too-ta-KWEN-da DAR" }
      ],
      grammar: {
        rule: "Future tense uses 'ta' marker: Ni-ta-kula (I will eat). Pattern: Subject + ta + verb root",
        examples: ["Nitakula = I will eat", "Utak ula = You will eat", "Atakula = He/She will eat"]
      }
    }
  },
  {
    level: "intermediate",
    title: "Health and Medicine",
    titleSwahili: "Afya na Dawa",
    titleChinese: "健康和药品",
    category: "Health",
    estimatedMinutes: 35,
    orderIndex: 35,
    content: {
      vocabulary: [
        { swahili: "ugonjwa", chinese: "疾病", english: "sickness", pronunciation: "oo-gon-JWA" },
        { swahili: "dawa", chinese: "药", english: "medicine", pronunciation: "DA-wa" },
        { swahili: "homa", chinese: "发烧", english: "fever", pronunciation: "HO-ma" },
        { swahili: "kuuma", chinese: "疼痛", english: "to hurt/pain", pronunciation: "koo-OO-ma" },
        { swahili: "daktari", chinese: "医生", english: "doctor", pronunciation: "dak-TA-ree" },
        { swahili: "muuguzi", chinese: "护士", english: "nurse", pronunciation: "moo-oo-GOO-zee" }
      ],
      phrases: [
        { swahili: "Ninaumwa na kichwa", chinese: "我头疼", english: "My head hurts", pronunciation: "nee-na-oom-WA na kee-CHWA" },
        { swahili: "Ninahitaji dawa", chinese: "我需要药", english: "I need medicine", pronunciation: "nee-na-hee-TA-jee DA-wa" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Work and Professions",
    titleSwahili: "Kazi na Taaluma",
    titleChinese: "工作和职业",
    category: "Vocabulary",
    estimatedMinutes: 30,
    orderIndex: 36,
    content: {
      vocabulary: [
        { swahili: "kazi", chinese: "工作", english: "work/job", pronunciation: "KA-zee" },
        { swahili: "mfanyakazi", chinese: "工人", english: "worker", pronunciation: "m-fan-ya-KA-zee" },
        { swahili: "mhandisi", chinese: "工程师", english: "engineer", pronunciation: "m-han-DEE-see" },
        { swahili: "mwuguzi", chinese: "护士", english: "nurse", pronunciation: "mwoo-GOO-zee" },
        { swahili: "dereva", chinese: "司机", english: "driver", pronunciation: "deh-REH-va" },
        { swahili: "ofisi", chinese: "办公室", english: "office", pronunciation: "o-FEE-see" }
      ],
      phrases: [
        { swahili: "Nafanya kazi hospitalini", chinese: "我在医院工作", english: "I work at the hospital", pronunciation: "na-FAN-ya KA-zee ho-spee-ta-LEE-nee" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Making Phone Calls",
    titleSwahili: "Kupiga Simu",
    titleChinese: "打电话",
    category: "Communication",
    estimatedMinutes: 30,
    orderIndex: 37,
    content: {
      vocabulary: [
        { swahili: "simu", chinese: "电话", english: "phone", pronunciation: "SEE-moo" },
        { swahili: "kupiga simu", chinese: "打电话", english: "to call", pronunciation: "koo-PEE-ga SEE-moo" },
        { swahili: "namba", chinese: "号码", english: "number", pronunciation: "NAM-ba" },
        { swahili: "ujumbe", chinese: "消息", english: "message", pronunciation: "oo-JOOM-beh" }
      ],
      phrases: [
        { swahili: "Namba yako ya simu ni nini?", chinese: "你的电话号码是多少？", english: "What is your phone number?", pronunciation: "NAM-ba YA-ko ya SEE-moo nee NEE-nee" },
        { swahili: "Nitakupigia simu kesho", chinese: "我明天给你打电话", english: "I will call you tomorrow", pronunciation: "nee-ta-koo-pee-GEE-a SEE-moo KEH-shoh" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "At the Bank",
    titleSwahili: "Benkini",
    titleChinese: "在银行",
    category: "Business",
    estimatedMinutes: 30,
    orderIndex: 38,
    content: {
      vocabulary: [
        { swahili: "benki", chinese: "银行", english: "bank", pronunciation: "BEN-kee" },
        { swahili: "akaunti", chinese: "账户", english: "account", pronunciation: "a-KA-oon-tee" },
        { swahili: "kuweka", chinese: "存", english: "to deposit/save", pronunciation: "koo-WEH-ka" },
        { swahili: "kutoa", chinese: "取", english: "to withdraw", pronunciation: "koo-TO-a" },
        { swahili: "saini", chinese: "签名", english: "signature", pronunciation: "SA-ee-nee" }
      ],
      phrases: [
        { swahili: "Nataka kufungua akaunti", chinese: "我想开账户", english: "I want to open an account", pronunciation: "na-TA-ka koo-foon-GOO-a a-KA-oon-tee" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Hotel and Accommodation",
    titleSwahili: "Hoteli na Malazi",
    titleChinese: "酒店和住宿",
    category: "Travel",
    estimatedMinutes: 30,
    orderIndex: 39,
    content: {
      vocabulary: [
        { swahili: "hoteli", chinese: "酒店", english: "hotel", pronunciation: "ho-TEH-lee" },
        { swahili: "chumba", chinese: "房间", english: "room", pronunciation: "CHOOM-ba" },
        { swahili: "kuhifadhi", chinese: "预订", english: "to book/reserve", pronunciation: "koo-hee-FA-dhee" },
        { swahili: "ufunguo", chinese: "钥匙", english: "key", pronunciation: "oo-foon-GOO-o" },
        { swahili: "usiku mmoja", chinese: "一晚", english: "one night", pronunciation: "oo-SEE-koo m-MO-ja" }
      ],
      phrases: [
        { swahili: "Ninahitaji chumba kwa usiku mmoja", chinese: "我需要一晚的房间", english: "I need a room for one night", pronunciation: "nee-na-hee-TA-jee CHOOM-ba kwa oo-SEE-koo m-MO-ja" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Describing People",
    titleSwahili: "Kuelezea Watu",
    titleChinese: "描述人",
    category: "Conversation",
    estimatedMinutes: 30,
    orderIndex: 40,
    content: {
      vocabulary: [
        { swahili: "mrefu", chinese: "高", english: "tall", pronunciation: "m-REH-foo" },
        { swahili: "mfupi", chinese: "矮", english: "short (height)", pronunciation: "m-FOO-pee" },
        { swahili: "mnene", chinese: "胖", english: "fat", pronunciation: "m-NEH-neh" },
        { swahili: "mwembamba", chinese: "瘦", english: "thin", pronunciation: "mwem-BAM-ba" },
        { swahili: "mzuri", chinese: "漂亮", english: "beautiful/handsome", pronunciation: "m-ZOO-ree" }
      ],
      phrases: [
        { swahili: "Yeye ni mrefu sana", chinese: "他/她很高", english: "He/She is very tall", pronunciation: "YEH-yeh nee m-REH-foo SA-na" }
      ]
    }
  },

  // MONTH 5 (Weeks 17-20)
  {
    level: "intermediate",
    title: "Expressing Opinions",
    titleSwahili: "Kutoa Maoni",
    titleChinese: "表达意见",
    category: "Conversation",
    estimatedMinutes: 30,
    orderIndex: 41,
    content: {
      vocabulary: [
        { swahili: "maoni", chinese: "意见", english: "opinion", pronunciation: "ma-O-nee" },
        { swahili: "nadhani", chinese: "我认为", english: "I think", pronunciation: "na-DHA-nee" },
        { swahili: "nafikiri", chinese: "我想", english: "I think", pronunciation: "na-fee-KEE-ree" },
        { swahili: "nakubali", chinese: "我同意", english: "I agree", pronunciation: "na-koo-BA-lee" }
      ],
      phrases: [
        { swahili: "Nadhani ni wazo zuri", chinese: "我认为这是个好主意", english: "I think it's a good idea", pronunciation: "na-DHA-nee nee WA-zo ZOO-ree" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Weather and Climate",
    titleSwahili: "Hali ya Hewa na Tabia Nchi",
    titleChinese: "天气和气候",
    category: "Conversation",
    estimatedMinutes: 30,
    orderIndex: 42,
    content: {
      vocabulary: [
        { swahili: "radi", chinese: "雷", english: "thunder", pronunciation: "RA-dee" },
        { swahili: "umeme", chinese: "闪电", english: "lightning", pronunciation: "oo-MEH-meh" },
        { swahili: "dhoruba", chinese: "风暴", english: "storm", pronunciation: "dho-ROO-ba" },
        { swahili: "theluji", chinese: "雪", english: "snow", pronunciation: "the-LOO-jee" }
      ],
      phrases: [
        { swahili: "Kuna dhoruba kubwa", chinese: "有大风暴", english: "There's a big storm", pronunciation: "KOO-na dho-ROO-ba koo-BWA" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Technology",
    titleSwahili: "Teknolojia",
    titleChinese: "技术",
    category: "Vocabulary",
    estimatedMinutes: 30,
    orderIndex: 43,
    content: {
      vocabulary: [
        { swahili: "kompyuta", chinese: "电脑", english: "computer", pronunciation: "kom-PYOO-ta" },
        { swahili: "intaneti", chinese: "互联网", english: "internet", pronunciation: "een-ta-NEH-tee" },
        { swahili: "barua pepe", chinese: "电子邮件", english: "email", pronunciation: "ba-ROO-a PEH-peh" },
        { swahili: "programu", chinese: "程序", english: "program/app", pronunciation: "pro-GRA-moo" }
      ],
      phrases: [
        { swahili: "Ninatumia kompyuta kila siku", chinese: "我每天使用电脑", english: "I use computer every day", pronunciation: "nee-na-too-MEE-a kom-PYOO-ta KEE-la SEE-koo" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Sports and Recreation",
    titleSwahili: "Michezo na Burudani",
    titleChinese: "体育和娱乐",
    category: "Conversation",
    estimatedMinutes: 30,
    orderIndex: 44,
    content: {
      vocabulary: [
        { swahili: "mchezo", chinese: "运动/游戏", english: "sport/game", pronunciation: "m-CHEH-zo" },
        { swahili: "timu", chinese: "队", english: "team", pronunciation: "TEE-moo" },
        { swahili: "kushinda", chinese: "赢", english: "to win", pronunciation: "koo-SHEEN-da" },
        { swahili: "kupoteza", chinese: "输", english: "to lose", pronunciation: "koo-po-TEH-za" },
        { swahili: "uwanja", chinese: "场地", english: "field/playground", pronunciation: "oo-WAN-ja" }
      ],
      phrases: [
        { swahili: "Timu yetu ilishinda", chinese: "我们队赢了", english: "Our team won", pronunciation: "TEE-moo YEH-too ee-lee-SHEEN-da" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Comparing Things",
    titleSwahili: "Kulinganisha Vitu",
    titleChinese: "比较事物",
    category: "Grammar",
    estimatedMinutes: 35,
    orderIndex: 45,
    content: {
      vocabulary: [
        { swahili: "kuliko", chinese: "比", english: "than", pronunciation: "koo-LEE-ko" },
        { swahili: "zaidi", chinese: "更多", english: "more", pronunciation: "za-EE-dee" },
        { swahili: "kidogo", chinese: "更少", english: "less/a little", pronunciation: "kee-DO-go" }
      ],
      phrases: [
        { swahili: "Yeye ni mrefu kuliko mimi", chinese: "他比我高", english: "He is taller than me", pronunciation: "YEH-yeh nee m-REH-foo koo-LEE-ko MEE-mee" },
        { swahili: "Hii ni bora zaidi", chinese: "这个更好", english: "This is better", pronunciation: "HEE nee BO-ra za-EE-dee" }
      ],
      grammar: {
        rule: "Use 'kuliko' for comparisons: X ni kubwa kuliko Y (X is bigger than Y). Use 'zaidi' for more.",
        examples: ["Gari langu ni kubwa kuliko lako = My car is bigger than yours"]
      }
    }
  },
  {
    level: "intermediate",
    title: "Cooking",
    titleSwahili: "Kupika",
    titleChinese: "烹饪",
    category: "Vocabulary",
    estimatedMinutes: 30,
    orderIndex: 46,
    content: {
      vocabulary: [
        { swahili: "kupika", chinese: "做饭", english: "to cook", pronunciation: "koo-PEE-ka" },
        { swahili: "kukata", chinese: "切", english: "to cut", pronunciation: "koo-KA-ta" },
        { swahili: "kuchemsha", chinese: "煮", english: "to boil", pronunciation: "koo-chem-SHA" },
        { swahili: "kukaanga", chinese: "炒/煎", english: "to fry", pronunciation: "koo-ka-AN-ga" },
        { swahili: "chumvi", chinese: "盐", english: "salt", pronunciation: "CHOOM-vee" },
        { swahili: "sukari", chinese: "糖", english: "sugar", pronunciation: "soo-KA-ree" }
      ],
      phrases: [
        { swahili: "Ninapika chakula", chinese: "我在做饭", english: "I am cooking food", pronunciation: "nee-na-PEE-ka cha-KOO-la" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Celebrations and Holidays",
    titleSwahili: "Sherehe na Likizo",
    titleChinese: "庆祝和假期",
    category: "Culture",
    estimatedMinutes: 30,
    orderIndex: 47,
    content: {
      vocabulary: [
        { swahili: "sherehe", chinese: "庆祝", english: "celebration", pronunciation: "sheh-REH-heh" },
        { swahili: "sikukuu", chinese: "节日", english: "holiday/festival", pronunciation: "see-koo-KOO" },
        { swahili: "zawadi", chinese: "礼物", english: "gift", pronunciation: "za-WA-dee" },
        { swahili: "karamu", chinese: "宴会", english: "feast", pronunciation: "ka-RA-moo" }
      ],
      phrases: [
        { swahili: "Furaha ya sikukuu!", chinese: "节日快乐！", english: "Happy holiday!", pronunciation: "foo-RA-ha ya see-koo-KOO" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Environment",
    titleSwahili: "Mazingira",
    titleChinese: "环境",
    category: "Vocabulary",
    estimatedMinutes: 30,
    orderIndex: 48,
    content: {
      vocabulary: [
        { swahili: "mazingira", chinese: "环境", english: "environment", pronunciation: "ma-zeen-GEE-ra" },
        { swahili: "uchafuzi", chinese: "污染", english: "pollution", pronunciation: "oo-cha-FOO-zee" },
        { swahili: "mti", chinese: "树", english: "tree", pronunciation: "m-TEE" },
        { swahili: "msitu", chinese: "森林", english: "forest", pronunciation: "m-SEE-too" },
        { swahili: "bahari", chinese: "海", english: "sea/ocean", pronunciation: "ba-HA-ree" }
      ],
      phrases: [
        { swahili: "Tunalinda mazingira", chinese: "我们保护环境", english: "We protect the environment", pronunciation: "too-na-LEEN-da ma-zeen-GEE-ra" }
      ]
    }
  },

  // MONTH 6 (Weeks 21-24)
  {
    level: "intermediate",
    title: "Renting a House",
    titleSwahili: "Kukodi Nyumba",
    titleChinese: "租房",
    category: "Housing",
    estimatedMinutes: 35,
    orderIndex: 49,
    content: {
      vocabulary: [
        { swahili: "kukodi", chinese: "租", english: "to rent", pronunciation: "koo-KO-dee" },
        { swahili: "kodi", chinese: "租金", english: "rent (payment)", pronunciation: "KO-dee" },
        { swahili: "mwenye nyumba", chinese: "房东", english: "landlord", pronunciation: "MWEN-yeh NYOOM-ba" },
        { swahili: "mpangaji", chinese: "租客", english: "tenant", pronunciation: "m-pan-GA-jee" }
      ],
      phrases: [
        { swahili: "Kodi ni kiasi gani?", chinese: "租金是多少？", english: "How much is the rent?", pronunciation: "KO-dee nee kee-A-see GA-nee" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Emergency Situations",
    titleSwahili: "Hali za Dharura",
    titleChinese: "紧急情况",
    category: "Safety",
    estimatedMinutes: 30,
    orderIndex: 50,
    content: {
      vocabulary: [
        { swahili: "dharura", chinese: "紧急", english: "emergency", pronunciation: "dha-ROO-ra" },
        { swahili: "hatari", chinese: "危险", english: "danger", pronunciation: "ha-TA-ree" },
        { swahili: "msaada", chinese: "帮助", english: "help/aid", pronunciation: "m-sa-A-da" },
        { swahili: "polisi", chinese: "警察", english: "police", pronunciation: "po-LEE-see" },
        { swahili: "moto", chinese: "火", english: "fire", pronunciation: "MO-to" }
      ],
      phrases: [
        { swahili: "Nisaidieni!", chinese: "帮帮我！", english: "Help me!", pronunciation: "nee-sa-ee-DEE-eh-nee" },
        { swahili: "Nipigie polisi", chinese: "给我叫警察", english: "Call the police for me", pronunciation: "nee-pee-GEE-eh po-LEE-see" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Vehicles and Maintenance",
    titleSwahili: "Magari na Matengenezo",
    titleChinese: "车辆和维护",
    category: "Transportation",
    estimatedMinutes: 30,
    orderIndex: 51,
    content: {
      vocabulary: [
        { swahili: "kutengeneza", chinese: "修理", english: "to repair/fix", pronunciation: "koo-ten-geh-NEH-za" },
        { swahili: "fundi", chinese: "技工", english: "technician/mechanic", pronunciation: "FOON-dee" },
        { swahili: "tairi", chinese: "轮胎", english: "tire", pronunciation: "ta-EE-ree" },
        { swahili: "mafuta", chinese: "油", english: "oil/fuel", pronunciation: "ma-FOO-ta" }
      ],
      phrases: [
        { swahili: "Gari langu limeharibika", chinese: "我的车坏了", english: "My car is broken", pronunciation: "GA-ree LAN-goo lee-meh-ha-ree-BEE-ka" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Government and Politics",
    titleSwahili: "Serikali na Siasa",
    titleChinese: "政府和政治",
    category: "Vocabulary",
    estimatedMinutes: 30,
    orderIndex: 52,
    content: {
      vocabulary: [
        { swahili: "serikali", chinese: "政府", english: "government", pronunciation: "seh-ree-KA-lee" },
        { swahili: "rais", chinese: "总统", english: "president", pronunciation: "RA-ees" },
        { swahili: "uchaguzi", chinese: "选举", english: "election", pronunciation: "oo-cha-GOO-zee" },
        { swahili: "sheria", chinese: "法律", english: "law", pronunciation: "sheh-REE-a" }
      ],
      phrases: [
        { swahili: "Uchaguzi utafanyika lini?", chinese: "选举什么时候举行？", english: "When will the election be held?", pronunciation: "oo-cha-GOO-zee oo-ta-fan-YEE-ka LEE-nee" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Money and Finance",
    titleSwahili: "Pesa na Fedha",
    titleChinese: "金钱和财务",
    category: "Business",
    estimatedMinutes: 30,
    orderIndex: 53,
    content: {
      vocabulary: [
        { swahili: "pesa", chinese: "钱", english: "money", pronunciation: "PEH-sa" },
        { swahili: "fedha", chinese: "财务", english: "finance/money", pronunciation: "FEH-dha" },
        { swahili: "mkopo", chinese: "贷款", english: "loan", pronunciation: "m-KO-po" },
        { swahili: "faida", chinese: "利润", english: "profit", pronunciation: "fa-EE-da" },
        { swahili: "hasara", chinese: "损失", english: "loss", pronunciation: "ha-SA-ra" }
      ],
      phrases: [
        { swahili: "Nahitaji mkopo", chinese: "我需要贷款", english: "I need a loan", pronunciation: "na-hee-TA-jee m-KO-po" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Cultural Customs",
    titleSwahili: "Desturi za Kitamaduni",
    titleChinese: "文化习俗",
    category: "Culture",
    estimatedMinutes: 30,
    orderIndex: 54,
    content: {
      vocabulary: [
        { swahili: "desturi", chinese: "习俗", english: "custom/tradition", pronunciation: "deh-STOO-ree" },
        { swahili: "tamaduni", chinese: "文化", english: "culture", pronunciation: "ta-ma-DOO-nee" },
        { swahili: "utamaduni", chinese: "文明", english: "civilization", pronunciation: "oo-ta-ma-DOO-nee" },
        { swahili: "heshima", chinese: "尊重", english: "respect", pronunciation: "heh-SHEE-ma" }
      ],
      phrases: [
        { swahili: "Tunaheshimu desturi zetu", chinese: "我们尊重我们的传统", english: "We respect our traditions", pronunciation: "too-na-heh-SHEE-moo deh-STOO-ree ZEH-too" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Planning Events",
    titleSwahili: "Kupanga Matukio",
    titleChinese: "计划活动",
    category: "Conversation",
    estimatedMinutes: 30,
    orderIndex: 55,
    content: {
      vocabulary: [
        { swahili: "kupanga", chinese: "计划", english: "to plan/arrange", pronunciation: "koo-PAN-ga" },
        { swahili: "tukio", chinese: "活动/事件", english: "event", pronunciation: "too-KEE-o" },
        { swahili: "mkutano", chinese: "会议", english: "meeting", pronunciation: "m-koo-TA-no" },
        { swahili: "mwaliko", chinese: "邀请", english: "invitation", pronunciation: "mwa-LEE-ko" }
      ],
      phrases: [
        { swahili: "Tunapanga mkutano kesho", chinese: "我们明天计划开会", english: "We are planning a meeting tomorrow", pronunciation: "too-na-PAN-ga m-koo-TA-no KEH-shoh" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Religion and Beliefs",
    titleSwahili: "Dini na Imani",
    titleChinese: "宗教和信仰",
    category: "Culture",
    estimatedMinutes: 30,
    orderIndex: 56,
    content: {
      vocabulary: [
        { swahili: "dini", chinese: "宗教", english: "religion", pronunciation: "DEE-nee" },
        { swahili: "imani", chinese: "信仰", english: "faith/belief", pronunciation: "ee-MA-nee" },
        { swahili: "msikiti", chinese: "清真寺", english: "mosque", pronunciation: "m-see-KEE-tee" },
        { swahili: "kanisa", chinese: "教堂", english: "church", pronunciation: "ka-NEE-sa" },
        { swahili: "kuomba", chinese: "祈祷", english: "to pray", pronunciation: "koo-OM-ba" }
      ],
      phrases: [
        { swahili: "Ninaenda msikitini", chinese: "我去清真寺", english: "I am going to the mosque", pronunciation: "nee-na-EN-da m-see-kee-TEE-nee" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Agriculture and Farming",
    titleSwahili: "Kilimo",
    titleChinese: "农业和耕作",
    category: "Vocabulary",
    estimatedMinutes: 30,
    orderIndex: 57,
    content: {
      vocabulary: [
        { swahili: "kilimo", chinese: "农业", english: "agriculture", pronunciation: "kee-LEE-mo" },
        { swahili: "shamba", chinese: "农场", english: "farm/field", pronunciation: "SHAM-ba" },
        { swahili: "kulima", chinese: "耕种", english: "to cultivate", pronunciation: "koo-LEE-ma" },
        { swahili: "mkulima", chinese: "农民", english: "farmer", pronunciation: "m-koo-LEE-ma" },
        { swahili: "mavuno", chinese: "收获", english: "harvest", pronunciation: "ma-VOO-no" }
      ],
      phrases: [
        { swahili: "Babangu ni mkulima", chinese: "我爸爸是农民", english: "My father is a farmer", pronunciation: "ba-BAN-goo nee m-koo-LEE-ma" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "News and Media",
    titleSwahili: "Habari na Vyombo vya Habari",
    titleChinese: "新闻和媒体",
    category: "Vocabulary",
    estimatedMinutes: 30,
    orderIndex: 58,
    content: {
      vocabulary: [
        { swahili: "habari", chinese: "新闻", english: "news", pronunciation: "ha-BA-ree" },
        { swahili: "gazeti", chinese: "报纸", english: "newspaper", pronunciation: "ga-ZEH-tee" },
        { swahili: "redio", chinese: "收音机", english: "radio", pronunciation: "REH-dee-o" },
        { swahili: "televisheni", chinese: "电视", english: "television", pronunciation: "teh-leh-vee-SHEH-nee" }
      ],
      phrases: [
        { swahili: "Nasoma gazeti kila asubuhi", chinese: "我每天早上看报纸", english: "I read newspaper every morning", pronunciation: "na-SO-ma ga-ZEH-tee KEE-la a-soo-BOO-hee" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Intermediate Review",
    titleSwahili: "Marudio ya Kiwango cha Kati",
    titleChinese: "中级复习",
    category: "Review",
    estimatedMinutes: 40,
    orderIndex: 59,
    content: {
      vocabulary: [
        { swahili: "kiwango cha kati", chinese: "中级", english: "intermediate level", pronunciation: "kee-WAN-go cha KA-tee" }
      ],
      phrases: [
        { swahili: "Nimejifunza mengi", chinese: "我学到了很多", english: "I have learned a lot", pronunciation: "nee-meh-jee-FOON-za MEN-gee" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Expressing Gratitude",
    titleSwahili: "Kuonyesha Shukrani",
    titleChinese: "表达感激",
    category: "Conversation",
    estimatedMinutes: 25,
    orderIndex: 60,
    content: {
      vocabulary: [
        { swahili: "shukrani", chinese: "感谢", english: "gratitude/thanks", pronunciation: "shoo-KRA-nee" },
        { swahili: "kukushukuru", chinese: "感谢你", english: "to thank you", pronunciation: "koo-koo-shoo-KOO-roo" }
      ],
      phrases: [
        { swahili: "Nakushukuru sana", chinese: "非常感谢你", english: "Thank you very much", pronunciation: "na-koo-shoo-KOO-roo SA-na" },
        { swahili: "Nina shukrani nyingi", chinese: "我很感激", english: "I have many thanks", pronunciation: "NEE-na shoo-KRA-nee NYEEN-gee" }
      ]
    }
  },

  // ADVANCED LEVEL - MONTH 7 (Weeks 25-28)
  {
    level: "advanced",
    title: "Business Meetings",
    titleSwahili: "Mikutano ya Biashara",
    titleChinese: "商务会议",
    category: "Business",
    estimatedMinutes: 40,
    orderIndex: 61,
    content: {
      vocabulary: [
        { swahili: "ajenda", chinese: "议程", english: "agenda", pronunciation: "a-JEN-da" },
        { swahili: "mkataba", chinese: "合同", english: "contract", pronunciation: "m-ka-TA-ba" },
        { swahili: "ushirikiano", chinese: "合作", english: "cooperation", pronunciation: "oo-shee-ree-kee-A-no" },
        { swahili: "uwekezaji", chinese: "投资", english: "investment", pronunciation: "oo-weh-keh-ZA-jee" }
      ],
      phrases: [
        { swahili: "Tunajadili mkataba mpya", chinese: "我们正在讨论新合同", english: "We are discussing a new contract", pronunciation: "too-na-ja-DEE-lee m-ka-TA-ba m-PYA" }
      ],
      grammar: {
        rule: "Advanced business vocabulary requires understanding of formal register and professional contexts",
        examples: ["Tunapendekeza ushirikiano = We recommend cooperation"]
      }
    }
  },
  {
    level: "advanced",
    title: "Academic Language",
    titleSwahili: "Lugha ya Kitaaluma",
    titleChinese: "学术语言",
    category: "Academic",
    estimatedMinutes: 40,
    orderIndex: 62,
    content: {
      vocabulary: [
        { swahili: "utafiti", chinese: "研究", english: "research", pronunciation: "oo-ta-FEE-tee" },
        { swahili: "nadharia", chinese: "理论", english: "theory", pronunciation: "na-DHA-ree-a" },
        { swahili: "uchunguzi", chinese: "调查", english: "investigation", pronunciation: "oo-choon-GOO-zee" },
        { swahili: "uchambuzi", chinese: "分析", english: "analysis", pronunciation: "oo-cham-BOO-zee" }
      ],
      phrases: [
        { swahili: "Ninafanya utafiti kuhusu mazingira", chinese: "我正在进行关于环境的研究", english: "I am doing research about environment", pronunciation: "nee-na-FAN-ya oo-ta-FEE-tee koo-HOO-soo ma-zeen-GEE-ra" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Complex Grammar Structures",
    titleSwahili: "Miundo Changamano ya Sarufi",
    titleChinese: "复杂语法结构",
    category: "Grammar",
    estimatedMinutes: 45,
    orderIndex: 63,
    content: {
      vocabulary: [
        { swahili: "ingawa", chinese: "虽然", english: "although", pronunciation: "een-GA-wa" },
        { swahili: "hata hivyo", chinese: "然而", english: "however", pronunciation: "HA-ta HEE-vyo" },
        { swahili: "kwa hiyo", chinese: "因此", english: "therefore", pronunciation: "kwa HEE-yo" }
      ],
      phrases: [
        { swahili: "Ingawa ni vigumu, nitaendelea", chinese: "虽然很难，但我会继续", english: "Although it's difficult, I will continue", pronunciation: "een-GA-wa nee vee-GOO-moo, nee-ta-en-deh-LEH-a" }
      ],
      grammar: {
        rule: "Complex sentences use conjunctions and relative clauses to connect ideas",
        examples: ["Kitu ambacho nilikiona = The thing which I saw"]
      }
    }
  },
  {
    level: "advanced",
    title: "Legal Terminology",
    titleSwahili: "Istilahi za Kisheria",
    titleChinese: "法律术语",
    category: "Professional",
    estimatedMinutes: 40,
    orderIndex: 64,
    content: {
      vocabulary: [
        { swahili: "mahakama", chinese: "法院", english: "court", pronunciation: "ma-ha-KA-ma" },
        { swahili: "mshtakiwa", chinese: "被告", english: "defendant", pronunciation: "m-shta-KEE-wa" },
        { swahili: "ushahidi", chinese: "证据", english: "evidence", pronunciation: "oo-sha-HEE-dee" },
        { swahili: "hukumu", chinese: "判决", english: "judgment", pronunciation: "hoo-KOO-moo" }
      ],
      phrases: [
        { swahili: "Mahakama imetoa hukumu", chinese: "法院已下判决", english: "The court has given judgment", pronunciation: "ma-ha-KA-ma ee-meh-TO-a hoo-KOO-moo" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Literature and Poetry",
    titleSwahili: "Fasihi na Ushairi",
    titleChinese: "文学和诗歌",
    category: "Culture",
    estimatedMinutes: 40,
    orderIndex: 65,
    content: {
      vocabulary: [
        { swahili: "fasihi", chinese: "文学", english: "literature", pronunciation: "fa-SEE-hee" },
        { swahili: "ushairi", chinese: "诗歌", english: "poetry", pronunciation: "oo-sha-EE-ree" },
        { swahili: "mshairi", chinese: "诗人", english: "poet", pronunciation: "m-sha-EE-ree" },
        { swahili: "hadithi", chinese: "故事", english: "story", pronunciation: "ha-DEE-thee" }
      ],
      phrases: [
        { swahili: "Napenda kusoma fasihi ya Kiswahili", chinese: "我喜欢读斯瓦希里文学", english: "I like reading Swahili literature", pronunciation: "na-PEN-da koo-SO-ma fa-SEE-hee ya kee-swa-HEE-lee" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Medical Terminology",
    titleSwahili: "Istilahi za Kimatibabu",
    titleChinese: "医学术语",
    category: "Professional",
    estimatedMinutes: 40,
    orderIndex: 66,
    content: {
      vocabulary: [
        { swahili: "matibabu", chinese: "医疗", english: "treatment/medicine", pronunciation: "ma-tee-BA-boo" },
        { swahili: "upasuaji", chinese: "手术", english: "surgery", pronunciation: "oo-pa-soo-A-jee" },
        { swahili: "chanjo", chinese: "疫苗", english: "vaccine", pronunciation: "CHAN-jo" },
        { swahili: "utambuzi", chinese: "诊断", english: "diagnosis", pronunciation: "oo-tam-BOO-zee" }
      ],
      phrases: [
        { swahili: "Mgonjwa anahitaji upasuaji wa haraka", chinese: "病人需要紧急手术", english: "The patient needs emergency surgery", pronunciation: "m-gon-JWA a-na-hee-TA-jee oo-pa-soo-A-jee wa ha-RA-ka" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Environmental Issues",
    titleSwahili: "Masuala ya Mazingira",
    titleChinese: "环境问题",
    category: "Academic",
    estimatedMinutes: 40,
    orderIndex: 67,
    content: {
      vocabulary: [
        { swahili: "uharibifu", chinese: "破坏", english: "destruction/damage", pronunciation: "oo-ha-ree-BEE-foo" },
        { swahili: "uokozi", chinese: "保护", english: "conservation", pronunciation: "oo-o-KO-zee" },
        { swahili: "mabadiliko ya tabia nchi", chinese: "气候变化", english: "climate change", pronunciation: "ma-ba-dee-LEE-ko ya ta-BEE-a n-CHEE" }
      ],
      phrases: [
        { swahili: "Tunapaswa kulinda mazingira yetu", chinese: "我们应该保护我们的环境", english: "We should protect our environment", pronunciation: "too-na-PA-swa koo-LEEN-da ma-zeen-GEE-ra YEH-too" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Idiomatic Expressions",
    titleSwahili: "Nahau",
    titleChinese: "习语表达",
    category: "Language",
    estimatedMinutes: 40,
    orderIndex: 68,
    content: {
      vocabulary: [
        { swahili: "nahau", chinese: "习语", english: "idiom", pronunciation: "na-HA-oo" },
        { swahili: "methali", chinese: "谚语", english: "proverb", pronunciation: "meh-THA-lee" }
      ],
      phrases: [
        { swahili: "Haraka haraka haina baraka", chinese: "欲速则不达", english: "Hurry hurry has no blessing (Haste makes waste)", pronunciation: "ha-RA-ka ha-RA-ka ha-EE-na ba-RA-ka" },
        { swahili: "Umoja ni nguvu", chinese: "团结就是力量", english: "Unity is strength", pronunciation: "oo-MO-ja nee n-GOO-voo" }
      ]
    }
  },

  // MONTH 8 (Weeks 29-32)
  {
    level: "advanced",
    title: "Economic Policy",
    titleSwahili: "Sera za Kiuchumi",
    titleChinese: "经济政策",
    category: "Business",
    estimatedMinutes: 40,
    orderIndex: 69,
    content: {
      vocabulary: [
        { swahili: "uchumi", chinese: "经济", english: "economy", pronunciation: "oo-CHOO-mee" },
        { swahili: "sera", chinese: "政策", english: "policy", pronunciation: "SEH-ra" },
        { swahili: "ukuaji", chinese: "增长", english: "growth", pronunciation: "oo-koo-A-jee" },
        { swahili: "mfumuko", chinese: "通货膨胀", english: "inflation", pronunciation: "m-foo-MOO-ko" }
      ],
      phrases: [
        { swahili: "Serikali inaboresha sera za kiuchumi", chinese: "政府正在改善经济政策", english: "The government is improving economic policies", pronunciation: "seh-ree-KA-lee ee-na-bo-REH-sha SEH-ra za kee-oo-CHOO-mee" }
      ]
    }
  },
  {
    level: "advanced",
    title: "International Relations",
    titleSwahili: "Mahusiano ya Kimataifa",
    titleChinese: "国际关系",
    category: "Politics",
    estimatedMinutes: 40,
    orderIndex: 70,
    content: {
      vocabulary: [
        { swahili: "kimataifa", chinese: "国际", english: "international", pronunciation: "kee-ma-ta-EE-fa" },
        { swahili: "diplomasia", chinese: "外交", english: "diplomacy", pronunciation: "dee-plo-MA-see-a" },
        { swahili: "mkataba wa kimataifa", chinese: "国际条约", english: "international treaty", pronunciation: "m-ka-TA-ba wa kee-ma-ta-EE-fa" }
      ],
      phrases: [
        { swahili: "Nchi zetu zina mahusiano mazuri", chinese: "我们的国家有良好的关系", english: "Our countries have good relations", pronunciation: "n-CHEE ZEH-too ZEE-na ma-hoo-see-A-no ma-ZOO-ree" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Scientific Research",
    titleSwahili: "Utafiti wa Kisayansi",
    titleChinese: "科学研究",
    category: "Academic",
    estimatedMinutes: 40,
    orderIndex: 71,
    content: {
      vocabulary: [
        { swahili: "sayansi", chinese: "科学", english: "science", pronunciation: "sa-YAN-see" },
        { swahili: "majaribio", chinese: "实验", english: "experiment", pronunciation: "ma-ja-ree-BEE-o" },
        { swahili: "matokeo", chinese: "结果", english: "results", pronunciation: "ma-to-KEH-o" },
        { swahili: "hitimisho", chinese: "结论", english: "conclusion", pronunciation: "hee-tee-MEE-sho" }
      ],
      phrases: [
        { swahili: "Tunafanya majaribio ya kisayansi", chinese: "我们正在进行科学实验", english: "We are conducting scientific experiments", pronunciation: "too-na-FAN-ya ma-ja-ree-BEE-o ya kee-sa-YAN-see" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Philosophy and Ethics",
    titleSwahili: "Falsafa na Maadili",
    titleChinese: "哲学和伦理",
    category: "Academic",
    estimatedMinutes: 40,
    orderIndex: 72,
    content: {
      vocabulary: [
        { swahili: "falsafa", chinese: "哲学", english: "philosophy", pronunciation: "fal-SA-fa" },
        { swahili: "maadili", chinese: "伦理", english: "ethics/morals", pronunciation: "ma-a-DEE-lee" },
        { swahili: "haki", chinese: "正义/权利", english: "justice/right", pronunciation: "HA-kee" },
        { swahili: "uwazi", chinese: "透明度", english: "transparency", pronunciation: "oo-WA-zee" }
      ],
      phrases: [
        { swahili: "Tunajadili masuala ya kimaadili", chinese: "我们正在讨论伦理问题", english: "We are discussing ethical issues", pronunciation: "too-na-ja-DEE-lee ma-soo-A-la ya kee-ma-a-DEE-lee" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Technology Innovation",
    titleSwahili: "Uvumbuzi wa Teknolojia",
    titleChinese: "技术创新",
    category: "Technology",
    estimatedMinutes: 40,
    orderIndex: 73,
    content: {
      vocabulary: [
        { swahili: "uvumbuzi", chinese: "创新", english: "innovation", pronunciation: "oo-voom-BOO-zee" },
        { swahili: "ufumbuzi", chinese: "解决方案", english: "solution", pronunciation: "oo-foom-BOO-zee" },
        { swahili: "akili bandia", chinese: "人工智能", english: "artificial intelligence", pronunciation: "a-KEE-lee ban-DEE-a" }
      ],
      phrases: [
        { swahili: "Teknolojia inaendelea kwa kasi", chinese: "技术发展迅速", english: "Technology is developing rapidly", pronunciation: "tek-no-LO-jee-a ee-na-en-deh-LEH-a kwa KA-see" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Historical Events",
    titleSwahili: "Matukio ya Kihistoria",
    titleChinese: "历史事件",
    category: "History",
    estimatedMinutes: 40,
    orderIndex: 74,
    content: {
      vocabulary: [
        { swahili: "historia", chinese: "历史", english: "history", pronunciation: "hee-STO-ree-a" },
        { swahili: "uhuru", chinese: "独立/自由", english: "independence/freedom", pronunciation: "oo-HOO-roo" },
        { swahili: "ukoloni", chinese: "殖民主义", english: "colonialism", pronunciation: "oo-ko-LO-nee" },
        { swahili: "mapinduzi", chinese: "革命", english: "revolution", pronunciation: "ma-peen-DOO-zee" }
      ],
      phrases: [
        { swahili: "Tanzania ilipata uhuru mwaka 1961", chinese: "坦桑尼亚在1961年获得独立", english: "Tanzania got independence in 1961", pronunciation: "tan-za-NEE-a ee-lee-PA-ta oo-HOO-roo MWA-ka elfu moja mia tisa sitini na moja" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Media and Communication",
    titleSwahili: "Vyombo vya Habari na Mawasiliano",
    titleChinese: "媒体和传播",
    category: "Professional",
    estimatedMinutes: 40,
    orderIndex: 75,
    content: {
      vocabulary: [
        { swahili: "mawasiliano", chinese: "传播/通讯", english: "communication", pronunciation: "ma-wa-see-lee-A-no" },
        { swahili: "uandishi wa habari", chinese: "新闻写作", english: "journalism", pronunciation: "oo-an-DEE-shee wa ha-BA-ree" },
        { swahili: "mhariri", chinese: "编辑", english: "editor", pronunciation: "m-ha-REE-ree" }
      ],
      phrases: [
        { swahili: "Mawasiliano ya kielektroniki yameenea", chinese: "电子通讯已普及", english: "Electronic communication has spread", pronunciation: "ma-wa-see-lee-A-no ya kee-eh-lek-tro-NEE-kee ya-meh-eh-NEH-a" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Social Issues",
    titleSwahili: "Masuala ya Kijamii",
    titleChinese: "社会问题",
    category: "Social",
    estimatedMinutes: 40,
    orderIndex: 76,
    content: {
      vocabulary: [
        { swahili: "jamii", chinese: "社会", english: "society", pronunciation: "ja-MEE-ee" },
        { swahili: "usawa", chinese: "平等", english: "equality", pronunciation: "oo-SA-wa" },
        { swahili: "ubaguzi", chinese: "歧视", english: "discrimination", pronunciation: "oo-ba-GOO-zee" },
        { swahili: "umasikini", chinese: "贫困", english: "poverty", pronunciation: "oo-ma-see-KEE-nee" }
      ],
      phrases: [
        { swahili: "Tunapambana na umasikini", chinese: "我们正在与贫困作斗争", english: "We are fighting poverty", pronunciation: "too-na-pam-BA-na na oo-ma-see-KEE-nee" }
      ]
    }
  },

  // MONTH 9 (Weeks 33-36) - Final Advanced Lessons
  {
    level: "advanced",
    title: "Educational Reform",
    titleSwahili: "Mageuzi ya Elimu",
    titleChinese: "教育改革",
    category: "Education",
    estimatedMinutes: 40,
    orderIndex: 77,
    content: {
      vocabulary: [
        { swahili: "elimu", chinese: "教育", english: "education", pronunciation: "eh-LEE-moo" },
        { swahili: "mageuzi", chinese: "改革", english: "reform/change", pronunciation: "ma-geh-OO-zee" },
        { swahili: "maendeleo", chinese: "发展", english: "development", pronunciation: "ma-en-deh-LEH-o" }
      ],
      phrases: [
        { swahili: "Tunahitaji mageuzi katika elimu yetu", chinese: "我们需要教育改革", english: "We need reform in our education", pronunciation: "too-na-hee-TA-jee ma-geh-OO-zee ka-TEE-ka eh-LEE-moo YEH-too" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Public Health",
    titleSwahili: "Afya ya Jamii",
    titleChinese: "公共卫生",
    category: "Health",
    estimatedMinutes: 40,
    orderIndex: 78,
    content: {
      vocabulary: [
        { swahili: "usafi", chinese: "卫生/清洁", english: "hygiene/cleanliness", pronunciation: "oo-SA-fee" },
        { swahili: "mlipuko", chinese: "疫情爆发", english: "outbreak", pronunciation: "m-lee-POO-ko" },
        { swahili: "kinga", chinese: "免疫", english: "immunity/protection", pronunciation: "KEEN-ga" }
      ],
      phrases: [
        { swahili: "Afya ya jamii ni muhimu", chinese: "公共卫生很重要", english: "Public health is important", pronunciation: "AF-ya ya ja-MEE-ee nee moo-HEE-moo" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Urban Planning",
    titleSwahili: "Upangaji Miji",
    titleChinese: "城市规划",
    category: "Development",
    estimatedMinutes: 40,
    orderIndex: 79,
    content: {
      vocabulary: [
        { swahili: "upangaji", chinese: "规划", english: "planning", pronunciation: "oo-pan-GA-jee" },
        { swahili: "mji mkubwa", chinese: "大城市", english: "city", pronunciation: "m-JEE m-koo-BWA" },
        { swahili: "miundombinu", chinese: "基础设施", english: "infrastructure", pronunciation: "mee-oon-dom-BEE-noo" }
      ],
      phrases: [
        { swahili: "Upangaji bora wa miji unahitajika", chinese: "需要更好的城市规划", english: "Better urban planning is needed", pronunciation: "oo-pan-GA-jee BO-ra wa MEE-jee oo-na-hee-ta-JEE-ka" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Trade and Commerce",
    titleSwahili: "Biashara na Uchumi",
    titleChinese: "贸易和商业",
    category: "Business",
    estimatedMinutes: 40,
    orderIndex: 80,
    content: {
      vocabulary: [
        { swahili: "biashara", chinese: "贸易/生意", english: "trade/business", pronunciation: "bee-a-SHA-ra" },
        { swahili: "usafirishaji", chinese: "运输", english: "transportation/logistics", pronunciation: "oo-sa-fee-ree-SHA-jee" },
        { swahili: "makubaliano", chinese: "协议", english: "agreement", pronunciation: "ma-koo-ba-lee-A-no" }
      ],
      phrases: [
        { swahili: "Biashara ya kimataifa inaongezeka", chinese: "国际贸易正在增长", english: "International trade is increasing", pronunciation: "bee-a-SHA-ra ya kee-ma-ta-EE-fa ee-na-on-geh-ZEH-ka" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Energy and Resources",
    titleSwahili: "Nishati na Rasilimali",
    titleChinese: "能源和资源",
    category: "Environment",
    estimatedMinutes: 40,
    orderIndex: 81,
    content: {
      vocabulary: [
        { swahili: "nishati", chinese: "能源", english: "energy", pronunciation: "nee-SHA-tee" },
        { swahili: "rasilimali", chinese: "资源", english: "resources", pronunciation: "ra-see-lee-MA-lee" },
        { swahili: "nishati safi", chinese: "清洁能源", english: "clean energy", pronunciation: "nee-SHA-tee SA-fee" },
        { swahili: "endelevu", chinese: "可持续", english: "sustainable", pronunciation: "en-deh-LEH-voo" }
      ],
      phrases: [
        { swahili: "Tunahitaji nishati endelevu", chinese: "我们需要可持续能源", english: "We need sustainable energy", pronunciation: "too-na-hee-TA-jee nee-SHA-tee en-deh-LEH-voo" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Human Rights",
    titleSwahili: "Haki za Binadamu",
    titleChinese: "人权",
    category: "Social",
    estimatedMinutes: 40,
    orderIndex: 82,
    content: {
      vocabulary: [
        { swahili: "haki za binadamu", chinese: "人权", english: "human rights", pronunciation: "HA-kee za bee-na-DA-moo" },
        { swahili: "uhuru wa kujieleza", chinese: "言论自由", english: "freedom of expression", pronunciation: "oo-HOO-roo wa koo-jee-eh-LEH-za" },
        { swahili: "haki sawa", chinese: "平等权利", english: "equal rights", pronunciation: "HA-kee SA-wa" }
      ],
      phrases: [
        { swahili: "Haki za binadamu zilindwe", chinese: "人权应受保护", english: "Human rights should be protected", pronunciation: "HA-kee za bee-na-DA-moo zee-LEEN-dweh" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Globalization",
    titleSwahili: "Utandawazi",
    titleChinese: "全球化",
    category: "Economics",
    estimatedMinutes: 40,
    orderIndex: 83,
    content: {
      vocabulary: [
        { swahili: "utandawazi", chinese: "全球化", english: "globalization", pronunciation: "oo-tan-da-WA-zee" },
        { swahili: "soko la kimataifa", chinese: "国际市场", english: "international market", pronunciation: "SO-ko la kee-ma-ta-EE-fa" },
        { swahili: "ushindani", chinese: "竞争", english: "competition", pronunciation: "oo-sheen-DA-nee" }
      ],
      phrases: [
        { swahili: "Utandawazi unaathiri uchumi wetu", chinese: "全球化影响我们的经济", english: "Globalization affects our economy", pronunciation: "oo-tan-da-WA-zee oo-na-a-THEE-ree oo-CHOO-mee WEH-too" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Cultural Heritage",
    titleSwahili: "Urithi wa Kitamaduni",
    titleChinese: "文化遗产",
    category: "Culture",
    estimatedMinutes: 40,
    orderIndex: 84,
    content: {
      vocabulary: [
        { swahili: "urithi", chinese: "遗产", english: "heritage/inheritance", pronunciation: "oo-REE-thee" },
        { swahili: "uhifadhi", chinese: "保存", english: "preservation", pronunciation: "oo-hee-FA-dhee" },
        { swahili: "makumbusho", chinese: "博物馆", english: "museum", pronunciation: "ma-koom-BOO-sho" }
      ],
      phrases: [
        { swahili: "Tunahifadhi urithi wetu wa kitamaduni", chinese: "我们保存我们的文化遗产", english: "We preserve our cultural heritage", pronunciation: "too-na-hee-FA-dhee oo-REE-thee WEH-too wa kee-ta-ma-DOO-nee" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Leadership and Governance",
    titleSwahili: "Uongozi na Utawala",
    titleChinese: "领导与治理",
    category: "Politics",
    estimatedMinutes: 40,
    orderIndex: 85,
    content: {
      vocabulary: [
        { swahili: "uongozi", chinese: "领导", english: "leadership", pronunciation: "oo-on-GO-zee" },
        { swahili: "utawala", chinese: "治理", english: "governance", pronunciation: "oo-ta-WA-la" },
        { swahili: "uwajibikaji", chinese: "问责制", english: "accountability", pronunciation: "oo-wa-jee-bee-KA-jee" }
      ],
      phrases: [
        { swahili: "Uongozi bora unahitajika", chinese: "需要良好的领导", english: "Good leadership is needed", pronunciation: "oo-on-GO-zee BO-ra oo-na-hee-ta-JEE-ka" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Digital Economy",
    titleSwahili: "Uchumi wa Kidijitali",
    titleChinese: "数字经济",
    category: "Technology",
    estimatedMinutes: 40,
    orderIndex: 86,
    content: {
      vocabulary: [
        { swahili: "kidijitali", chinese: "数字的", english: "digital", pronunciation: "kee-dee-jee-TA-lee" },
        { swahili: "huduma za mtandaoni", chinese: "在线服务", english: "online services", pronunciation: "hoo-DOO-ma za m-tan-da-O-nee" },
        { swahili: "malipo ya simu", chinese: "移动支付", english: "mobile payment", pronunciation: "ma-LEE-po ya SEE-moo" }
      ],
      phrases: [
        { swahili: "Uchumi wa kidijitali unakua kwa kasi", chinese: "数字经济快速增长", english: "Digital economy is growing rapidly", pronunciation: "oo-CHOO-mee wa kee-dee-jee-TA-lee oo-na-KOO-a kwa KA-see" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Crisis Management",
    titleSwahili: "Usimamizi wa Migogoro",
    titleChinese: "危机管理",
    category: "Professional",
    estimatedMinutes: 40,
    orderIndex: 87,
    content: {
      vocabulary: [
        { swahili: "mgogoro", chinese: "危机/冲突", english: "crisis/conflict", pronunciation: "m-go-GO-ro" },
        { swahili: "usimamizi", chinese: "管理", english: "management", pronunciation: "oo-see-ma-MEE-zee" },
        { swahili: "suluhisho", chinese: "解决", english: "solution", pronunciation: "soo-loo-HEE-sho" }
      ],
      phrases: [
        { swahili: "Tunahitaji mkakati wa kusimamia migogoro", chinese: "我们需要管理危机的策略", english: "We need a strategy to manage crises", pronunciation: "too-na-hee-TA-jee m-ka-KA-tee wa koo-see-MA-mee-a mee-go-GO-ro" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Professional Writing",
    titleSwahili: "Uandishi wa Kitaalamu",
    titleChinese: "专业写作",
    category: "Professional",
    estimatedMinutes: 40,
    orderIndex: 88,
    content: {
      vocabulary: [
        { swahili: "uandishi", chinese: "写作", english: "writing", pronunciation: "oo-an-DEE-shee" },
        { swahili: "ripoti", chinese: "报告", english: "report", pronunciation: "ree-PO-tee" },
        { swahili: "muhtasari", chinese: "摘要", english: "summary", pronunciation: "moo-hta-SA-ree" },
        { swahili: "mapendekezo", chinese: "建议", english: "recommendations", pronunciation: "ma-pen-deh-KEH-zo" }
      ],
      phrases: [
        { swahili: "Ninaandika ripoti ya kitaalamu", chinese: "我正在写专业报告", english: "I am writing a professional report", pronunciation: "nee-na-an-DEE-ka ree-PO-tee ya kee-ta-a-LA-moo" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Strategic Planning",
    titleSwahili: "Upangaji wa Kimkakati",
    titleChinese: "战略规划",
    category: "Business",
    estimatedMinutes: 40,
    orderIndex: 89,
    content: {
      vocabulary: [
        { swahili: "mkakati", chinese: "策略", english: "strategy", pronunciation: "m-ka-KA-tee" },
        { swahili: "malengo", chinese: "目标", english: "goals/objectives", pronunciation: "ma-LEN-go" },
        { swahili: "utekelezaji", chinese: "实施", english: "implementation", pronunciation: "oo-teh-keh-leh-ZA-jee" }
      ],
      phrases: [
        { swahili: "Tunapanga mkakati wa miaka mitano", chinese: "我们正在规划五年战略", english: "We are planning a five-year strategy", pronunciation: "too-na-PAN-ga m-ka-KA-tee wa mee-A-ka mee-TA-no" }
      ]
    }
  },
  {
    level: "advanced",
    title: "Advanced Review and Mastery",
    titleSwahili: "Marudio ya Juu na Ujuzi Kamili",
    titleChinese: "高级复习和精通",
    category: "Review",
    estimatedMinutes: 60,
    orderIndex: 90,
    content: {
      vocabulary: [
        { swahili: "ujuzi kamili", chinese: "精通", english: "mastery/complete skill", pronunciation: "oo-JOO-zee ka-MEE-lee" },
        { swahili: "ustadi", chinese: "专业知识", english: "expertise", pronunciation: "oo-STA-dee" }
      ],
      phrases: [
        { swahili: "Nimepata ujuzi kamili wa Kiswahili", chinese: "我已精通斯瓦希里语", english: "I have gained mastery of Swahili", pronunciation: "nee-meh-PA-ta oo-JOO-zee ka-MEE-lee wa kee-swa-HEE-lee" },
        { swahili: "Safari yangu ya kujifunza imekamilika", chinese: "我的学习旅程已完成", english: "My learning journey is complete", pronunciation: "sa-FA-ree YAN-goo ya koo-jee-FOON-za ee-meh-ka-mee-LEE-ka" }
      ]
    }
  }
];

async function insertMoreLessons() {
  console.log("Starting to insert additional curriculum lessons...");
  
  try {
    for (const lesson of moreLessons) {
      await db.insert(lessons).values({
        level: lesson.level,
        title: lesson.title,
        titleSwahili: lesson.titleSwahili,
        titleChinese: lesson.titleChinese,
        category: lesson.category,
        estimatedMinutes: lesson.estimatedMinutes,
        orderIndex: lesson.orderIndex,
        content: lesson.content
      });
      console.log(`✓ Inserted: ${lesson.titleChinese} (${lesson.titleSwahili}) - Order ${lesson.orderIndex}`);
    }
    
    console.log("\n✅ Successfully inserted all additional lessons!");
    console.log(`Total lessons added: ${moreLessons.length}`);
    
  } catch (error) {
    console.error("❌ Error inserting lessons:", error);
    throw error;
  }
}

insertMoreLessons()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
