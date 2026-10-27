import { db } from "./db";
import { lessons } from "@shared/schema";
import { sql } from "drizzle-orm";
import { curriculumLessons } from "../scripts/add-curriculum";
import { moreLessons } from "../scripts/add-more-curriculum";

export const sampleLessons = [
  // Beginner Level Lessons
  {
    level: "beginner",
    title: "Basic Greetings",
    titleSwahili: "Salamu za Kawaida",
    titleChinese: "基本问候语",
    category: "Conversation",
    estimatedMinutes: 15,
    orderIndex: 1,
    content: {
      vocabulary: [
        { swahili: "Jambo", chinese: "你好", english: "Hello", pronunciation: "JAHM-boh" },
        { swahili: "Habari", chinese: "消息/情况", english: "News/How are you", pronunciation: "hah-BAH-ree" },
        { swahili: "Nzuri", chinese: "好", english: "Good/Fine", pronunciation: "n-ZOO-ree" },
        { swahili: "Asante", chinese: "谢谢", english: "Thank you", pronunciation: "ah-SAHN-teh" },
        { swahili: "Karibu", chinese: "欢迎", english: "Welcome/You're welcome", pronunciation: "kah-REE-boo" },
      ],
      phrases: [
        { swahili: "Habari yako?", chinese: "你好吗？", english: "How are you?", pronunciation: "hah-BAH-ree YAH-koh" },
        { swahili: "Nzuri, asante", chinese: "很好，谢谢", english: "Fine, thank you", pronunciation: "n-ZOO-ree ah-SAHN-teh" },
        { swahili: "Karibu sana", chinese: "非常欢迎", english: "You're very welcome", pronunciation: "kah-REE-boo SAH-nah" },
      ],
      dialogues: [
        {
          lines: [
            { speaker: "A", swahili: "Jambo!", chinese: "你好！", english: "Hello!" },
            { speaker: "B", swahili: "Jambo! Habari yako?", chinese: "你好！你好吗？", english: "Hello! How are you?" },
            { speaker: "A", swahili: "Nzuri, asante. Wewe je?", chinese: "很好，谢谢。你呢？", english: "Fine, thank you. And you?" },
            { speaker: "B", swahili: "Nzuri pia.", chinese: "我也很好。", english: "Fine too." },
          ]
        }
      ]
    }
  },
  {
    level: "beginner",
    title: "Numbers 1-20",
    titleSwahili: "Namba 1-20",
    titleChinese: "数字1-20",
    category: "Numbers",
    estimatedMinutes: 20,
    orderIndex: 2,
    content: {
      vocabulary: [
        { swahili: "Moja", chinese: "一", english: "One", pronunciation: "MOH-jah" },
        { swahili: "Mbili", chinese: "二", english: "Two", pronunciation: "m-BEE-lee" },
        { swahili: "Tatu", chinese: "三", english: "Three", pronunciation: "TAH-too" },
        { swahili: "Nne", chinese: "四", english: "Four", pronunciation: "n-NEH" },
        { swahili: "Tano", chinese: "五", english: "Five", pronunciation: "TAH-noh" },
        { swahili: "Sita", chinese: "六", english: "Six", pronunciation: "SEE-tah" },
        { swahili: "Saba", chinese: "七", english: "Seven", pronunciation: "SAH-bah" },
        { swahili: "Nane", chinese: "八", english: "Eight", pronunciation: "NAH-neh" },
        { swahili: "Tisa", chinese: "九", english: "Nine", pronunciation: "TEE-sah" },
        { swahili: "Kumi", chinese: "十", english: "Ten", pronunciation: "KOO-mee" },
      ],
      phrases: [
        { swahili: "Nina miaka kumi", chinese: "我十岁", english: "I am ten years old", pronunciation: "NEE-nah mee-AH-kah KOO-mee" },
      ]
    }
  },
  {
    level: "beginner",
    title: "Family Members",
    titleSwahili: "Wanafamilia",
    titleChinese: "家庭成员",
    category: "Vocabulary",
    estimatedMinutes: 25,
    orderIndex: 3,
    content: {
      vocabulary: [
        { swahili: "Baba", chinese: "父亲", english: "Father", pronunciation: "BAH-bah" },
        { swahili: "Mama", chinese: "母亲", english: "Mother", pronunciation: "MAH-mah" },
        { swahili: "Kaka", chinese: "哥哥/弟弟", english: "Brother", pronunciation: "KAH-kah" },
        { swahili: "Dada", chinese: "姐姐/妹妹", english: "Sister", pronunciation: "DAH-dah" },
        { swahili: "Mtoto", chinese: "孩子", english: "Child", pronunciation: "m-TOH-toh" },
        { swahili: "Familia", chinese: "家庭", english: "Family", pronunciation: "fah-MEE-lee-ah" },
      ],
      phrases: [
        { swahili: "Hii ni familia yangu", chinese: "这是我的家庭", english: "This is my family", pronunciation: "HEE nee fah-MEE-lee-ah YAHN-goo" },
      ]
    }
  },
  // Intermediate Level Lessons
  {
    level: "intermediate",
    title: "At the Market",
    titleSwahili: "Sokoni",
    titleChinese: "在市场",
    category: "Shopping",
    estimatedMinutes: 30,
    orderIndex: 4,
    content: {
      vocabulary: [
        { swahili: "Soko", chinese: "市场", english: "Market", pronunciation: "SOH-koh" },
        { swahili: "Bei", chinese: "价格", english: "Price", pronunciation: "BEH-ee" },
        { swahili: "Nunua", chinese: "买", english: "Buy", pronunciation: "noo-NOO-ah" },
        { swahili: "Uza", chinese: "卖", english: "Sell", pronunciation: "OO-zah" },
        { swahili: "Pesa", chinese: "钱", english: "Money", pronunciation: "PEH-sah" },
        { swahili: "Matunda", chinese: "水果", english: "Fruits", pronunciation: "mah-TOON-dah" },
        { swahili: "Mboga", chinese: "蔬菜", english: "Vegetables", pronunciation: "m-BOH-gah" },
      ],
      phrases: [
        { swahili: "Bei gani?", chinese: "多少钱？", english: "What price?/How much?", pronunciation: "BEH-ee GAH-nee" },
        { swahili: "Nataka kununua matunda", chinese: "我想买水果", english: "I want to buy fruits", pronunciation: "nah-TAH-kah koo-noo-NOO-ah mah-TOON-dah" },
        { swahili: "Ni ghali sana", chinese: "太贵了", english: "It's too expensive", pronunciation: "nee GHA-lee SAH-nah" },
      ],
      dialogues: [
        {
          lines: [
            { speaker: "Customer", swahili: "Habari za asubuhi! Matunda haya ni bei gani?", chinese: "早上好！这些水果多少钱？", english: "Good morning! What's the price of these fruits?" },
            { speaker: "Seller", swahili: "Bei ni shilingi elfu mbili", chinese: "价格是两千先令", english: "The price is two thousand shillings" },
            { speaker: "Customer", swahili: "Ni ghali sana. Unaweza kupunguza?", chinese: "太贵了。你能降价吗？", english: "It's too expensive. Can you reduce?" },
            { speaker: "Seller", swahili: "Sawa, shilingi elfu moja tu", chinese: "好的，只要一千先令", english: "Okay, just one thousand shillings" },
          ]
        }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Asking for Directions",
    titleSwahili: "Kuuliza Njia",
    titleChinese: "问路",
    category: "Travel",
    estimatedMinutes: 25,
    orderIndex: 5,
    content: {
      vocabulary: [
        { swahili: "Wapi", chinese: "哪里", english: "Where", pronunciation: "WAH-pee" },
        { swahili: "Njia", chinese: "路/方向", english: "Road/Direction", pronunciation: "n-JEE-ah" },
        { swahili: "Kulia", chinese: "右边", english: "Right", pronunciation: "koo-LEE-ah" },
        { swahili: "Kushoto", chinese: "左边", english: "Left", pronunciation: "koo-SHOH-toh" },
        { swahili: "Moja kwa moja", chinese: "直走", english: "Straight ahead", pronunciation: "MOH-jah kwah MOH-jah" },
        { swahili: "Karibu", chinese: "附近", english: "Near", pronunciation: "kah-REE-boo" },
        { swahili: "Mbali", chinese: "远", english: "Far", pronunciation: "m-BAH-lee" },
      ],
      phrases: [
        { swahili: "Hoteli iko wapi?", chinese: "酒店在哪里？", english: "Where is the hotel?", pronunciation: "hoh-TEH-lee EE-koh WAH-pee" },
        { swahili: "Nenda moja kwa moja", chinese: "直走", english: "Go straight ahead", pronunciation: "NEHN-dah MOH-jah kwah MOH-jah" },
        { swahili: "Pinda kulia", chinese: "右转", english: "Turn right", pronunciation: "PEEN-dah koo-LEE-ah" },
      ]
    }
  },
  // Advanced Level Lessons
  {
    level: "advanced",
    title: "Business Meeting",
    titleSwahili: "Mkutano wa Biashara",
    titleChinese: "商务会议",
    category: "Business",
    estimatedMinutes: 40,
    orderIndex: 6,
    content: {
      vocabulary: [
        { swahili: "Mkutano", chinese: "会议", english: "Meeting", pronunciation: "m-koo-TAH-noh" },
        { swahili: "Biashara", chinese: "商业/生意", english: "Business", pronunciation: "bee-ah-SHAH-rah" },
        { swahili: "Mkataba", chinese: "合同", english: "Contract", pronunciation: "m-kah-TAH-bah" },
        { swahili: "Uwekezaji", chinese: "投资", english: "Investment", pronunciation: "oo-weh-keh-ZAH-jee" },
        { swahili: "Kampuni", chinese: "公司", english: "Company", pronunciation: "kahm-POO-nee" },
        { swahili: "Mpango", chinese: "计划", english: "Plan", pronunciation: "m-PAHN-goh" },
        { swahili: "Bajeti", chinese: "预算", english: "Budget", pronunciation: "bah-JEH-tee" },
      ],
      phrases: [
        { swahili: "Tunaweza kujadili mpango wetu?", chinese: "我们可以讨论我们的计划吗？", english: "Can we discuss our plan?", pronunciation: "too-nah-WEH-zah koo-jah-DEE-lee m-PAHN-goh WEH-too" },
        { swahili: "Nataka kusaini mkataba", chinese: "我想签合同", english: "I want to sign the contract", pronunciation: "nah-TAH-kah koo-sah-EE-nee m-kah-TAH-bah" },
      ],
      dialogues: [
        {
          lines: [
            { speaker: "Manager", swahili: "Habari za mkutano. Leo tutajadili uwekezaji mpya", chinese: "会议消息。今天我们将讨论新投资", english: "Meeting news. Today we'll discuss the new investment" },
            { speaker: "Partner", swahili: "Vizuri. Nina maswali machache kuhusu bajeti", chinese: "好的。我有几个关于预算的问题", english: "Good. I have a few questions about the budget" },
            { speaker: "Manager", swahili: "Tafadhali, uliza", chinese: "请问", english: "Please, ask" },
          ]
        }
      ]
    }
  },
  {
    level: "advanced",
    title: "Health and Medical",
    titleSwahili: "Afya na Matibabu",
    titleChinese: "健康和医疗",
    category: "Health",
    estimatedMinutes: 35,
    orderIndex: 7,
    content: {
      vocabulary: [
        { swahili: "Afya", chinese: "健康", english: "Health", pronunciation: "ah-FYAH" },
        { swahili: "Hospitali", chinese: "医院", english: "Hospital", pronunciation: "hohs-pee-TAH-lee" },
        { swahili: "Daktari", chinese: "医生", english: "Doctor", pronunciation: "dahk-TAH-ree" },
        { swahili: "Ugonjwa", chinese: "疾病", english: "Illness", pronunciation: "oo-gohn-JWA" },
        { swahili: "Dawa", chinese: "药", english: "Medicine", pronunciation: "DAH-wah" },
        { swahili: "Maumivu", chinese: "疼痛", english: "Pain", pronunciation: "mah-oo-MEE-voo" },
        { swahili: "Homa", chinese: "发烧", english: "Fever", pronunciation: "HOH-mah" },
      ],
      phrases: [
        { swahili: "Ninaumwa kichwani", chinese: "我头痛", english: "I have a headache", pronunciation: "nee-nah-oom-WAH kee-CHWAH-nee" },
        { swahili: "Nahitaji dawa", chinese: "我需要药", english: "I need medicine", pronunciation: "nah-hee-TAH-jee DAH-wah" },
        { swahili: "Wapi hospitali ya karibu?", chinese: "最近的医院在哪里？", english: "Where is the nearest hospital?", pronunciation: "WAH-pee hohs-pee-TAH-lee yah kah-REE-boo" },
      ]
    }
  },
];

export async function seedLessons({ onlyIfEmpty = false } = {}) {
  return db.transaction(async (tx) => {
    // Serialize initialization across instances without overwriting existing lessons.
    await tx.execute(sql`select pg_advisory_xact_lock(53849120)`);
    const existing = await tx.select({ level: lessons.level, title: lessons.title }).from(lessons);
    if (onlyIfEmpty && existing.length) return 0;
    const known = new Set(existing.map((lesson) => `${lesson.level}:${lesson.title}`));
    let inserted = 0;
    for (const lesson of [...curriculumLessons, ...moreLessons]) {
      const key = `${lesson.level}:${lesson.title}`;
      if (known.has(key)) continue;
      const content = lesson.content as Record<string, any>;
      const normalized = { ...content };
      if (!content.dialogues && Array.isArray(content.dialogue)) {
        normalized.dialogues = [{
          lines: content.dialogue.map((line: Record<string, string>) => ({
            speaker: line.speaker,
            swahili: line.swahili || line.text,
            chinese: line.chinese || line.translation,
            english: line.english || line.translation,
          })),
        }];
      }
      await tx.insert(lessons).values({ ...lesson, content: normalized });
      known.add(key);
      inserted++;
    }
    console.log(`Curriculum initialized: ${inserted} lessons added.`);
    return inserted;
  });
}

// Run if executed directly
const isMainModule = process.argv[1]?.endsWith("/seedLessons.ts") && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedLessons()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
