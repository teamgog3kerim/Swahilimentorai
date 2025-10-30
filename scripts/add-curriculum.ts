import { db } from "../server/db";
import { lessons } from "../shared/schema";

const curriculumLessons = [
  // BEGINNER LEVEL - MONTH 1 (Weeks 1-4)
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
        { swahili: "Jambo", chinese: "你好", english: "Hello", pronunciation: "JAM-boh" },
        { swahili: "Habari", chinese: "消息/新闻", english: "News/How are you", pronunciation: "ha-BA-ree" },
        { swahili: "Nzuri", chinese: "好", english: "Good/Fine", pronunciation: "n-ZOO-ree" },
        { swahili: "Asante", chinese: "谢谢", english: "Thank you", pronunciation: "a-SAN-teh" },
        { swahili: "Karibu", chinese: "欢迎", english: "Welcome/You're welcome", pronunciation: "ka-REE-boo" }
      ],
      phrases: [
        { swahili: "Habari yako?", chinese: "你好吗？", english: "How are you?", pronunciation: "ha-BA-ree YA-koh" },
        { swahili: "Nzuri sana", chinese: "很好", english: "Very good", pronunciation: "n-ZOO-ree SA-na" },
        { swahili: "Asante sana", chinese: "非常感谢", english: "Thank you very much", pronunciation: "a-SAN-teh SA-na" }
      ],
      dialogue: [
        { speaker: "Maria", text: "Jambo, habari yako?", translation: "Hello, how are you?" },
        { speaker: "John", text: "Nzuri sana, asante. Habari yako?", translation: "Very well, thank you. How are you?" },
        { speaker: "Maria", text: "Nzuri pia. Karibu!", translation: "Fine too. Welcome!" }
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
        { swahili: "moja", chinese: "一", english: "one", pronunciation: "MO-ja" },
        { swahili: "mbili", chinese: "二", english: "two", pronunciation: "m-BEE-lee" },
        { swahili: "tatu", chinese: "三", english: "three", pronunciation: "TA-too" },
        { swahili: "nne", chinese: "四", english: "four", pronunciation: "N-neh" },
        { swahili: "tano", chinese: "五", english: "five", pronunciation: "TA-noh" },
        { swahili: "sita", chinese: "六", english: "six", pronunciation: "SEE-ta" },
        { swahili: "saba", chinese: "七", english: "seven", pronunciation: "SA-ba" },
        { swahili: "nane", chinese: "八", english: "eight", pronunciation: "NA-neh" },
        { swahili: "tisa", chinese: "九", english: "nine", pronunciation: "TEE-sa" },
        { swahili: "kumi", chinese: "十", english: "ten", pronunciation: "KOO-mee" }
      ],
      phrases: [
        { swahili: "nina miaka kumi", chinese: "我十岁", english: "I am ten years old", pronunciation: "NEE-na mi-AH-ka KOO-mee" },
        { swahili: "bei gani?", chinese: "多少钱？", english: "How much?", pronunciation: "BEH-ee GA-nee" }
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
        { swahili: "baba", chinese: "爸爸", english: "father", pronunciation: "BA-ba" },
        { swahili: "mama", chinese: "妈妈", english: "mother", pronunciation: "MA-ma" },
        { swahili: "kaka", chinese: "哥哥", english: "older brother", pronunciation: "KA-ka" },
        { swahili: "dada", chinese: "姐姐", english: "older sister", pronunciation: "DA-da" },
        { swahili: "ndugu", chinese: "兄弟姐妹", english: "sibling", pronunciation: "n-DOO-goo" },
        { swahili: "bibi", chinese: "奶奶", english: "grandmother", pronunciation: "BEE-bee" },
        { swahili: "babu", chinese: "爷爷", english: "grandfather", pronunciation: "BA-boo" },
        { swahili: "mtoto", chinese: "孩子", english: "child", pronunciation: "m-TOH-toh" }
      ],
      phrases: [
        { swahili: "Familia yangu ni kubwa", chinese: "我的家庭很大", english: "My family is big", pronunciation: "fa-MEE-li-a YAN-goo nee koo-BW A" },
        { swahili: "Nina ndugu wawili", chinese: "我有两个兄弟姐妹", english: "I have two siblings", pronunciation: "NEE-na n-DOO-goo wa-WEE-lee" }
      ],
      dialogue: [
        { speaker: "Ali", text: "Una ndugu wangapi?", translation: "How many siblings do you have?" },
        { speaker: "Fatima", text: "Nina kaka mmoja na dada mmoja", translation: "I have one brother and one sister" },
        { speaker: "Ali", text: "Familia yako ni kubwa!", translation: "Your family is big!" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Introductions",
    titleSwahili: "Kujitambulisha",
    titleChinese: "自我介绍",
    category: "Conversation",
    estimatedMinutes: 20,
    orderIndex: 4,
    content: {
      vocabulary: [
        { swahili: "jina", chinese: "名字", english: "name", pronunciation: "JEE-na" },
        { swahili: "naitwa", chinese: "我叫", english: "I am called", pronunciation: "na-EE-twa" },
        { swahili: "kutoka", chinese: "来自", english: "from", pronunciation: "koo-TOH-ka" },
        { swahili: "nchi", chinese: "国家", english: "country", pronunciation: "n-CHEE" },
        { swahili: "mji", chinese: "城市", english: "city", pronunciation: "m-JEE" }
      ],
      phrases: [
        { swahili: "Jina langu ni...", chinese: "我的名字是...", english: "My name is...", pronunciation: "JEE-na LAN-goo nee" },
        { swahili: "Ninatoka China", chinese: "我来自中国", english: "I come from China", pronunciation: "nee-na-TOH-ka CHEE-na" },
        { swahili: "Ninafuraha kukutana nawe", chinese: "很高兴认识你", english: "Nice to meet you", pronunciation: "nee-na-foo-RA-ha koo-koo-TA-na NA-weh" }
      ],
      dialogue: [
        { speaker: "Teacher", text: "Jina lako nani?", translation: "What is your name?" },
        { speaker: "Student", text: "Jina langu ni Wei. Ninatoka Beijing", translation: "My name is Wei. I come from Beijing" },
        { speaker: "Teacher", text: "Karibu sana Wei!", translation: "Very welcome Wei!" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Colors",
    titleSwahili: "Rangi",
    titleChinese: "颜色",
    category: "Vocabulary",
    estimatedMinutes: 20,
    orderIndex: 5,
    content: {
      vocabulary: [
        { swahili: "nyekundu", chinese: "红色", english: "red", pronunciation: "nye-KOON-doo" },
        { swahili: "nyeupe", chinese: "白色", english: "white", pronunciation: "nye-OO-peh" },
        { swahili: "nyeusi", chinese: "黑色", english: "black", pronunciation: "nye-OO-see" },
        { swahili: "kijani", chinese: "绿色", english: "green", pronunciation: "kee-JA-nee" },
        { swahili: "bluu", chinese: "蓝色", english: "blue", pronunciation: "BLOO" },
        { swahili: "njano", chinese: "黄色", english: "yellow", pronunciation: "n-JA-noh" },
        { swahili: "kahawia", chinese: "棕色", english: "brown", pronunciation: "ka-ha-WEE-a" }
      ],
      phrases: [
        { swahili: "Ninapenda rangi ya bluu", chinese: "我喜欢蓝色", english: "I like the color blue", pronunciation: "nee-na-PEN-da RAN-gee ya BLOO" },
        { swahili: "Gari langu ni nyekundu", chinese: "我的车是红色的", english: "My car is red", pronunciation: "GA-ree LAN-goo nee nye-KOON-doo" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Common Verbs",
    titleSwahili: "Vitenzi vya Kawaida",
    titleChinese: "常用动词",
    category: "Grammar",
    estimatedMinutes: 25,
    orderIndex: 6,
    content: {
      vocabulary: [
        { swahili: "kula", chinese: "吃", english: "to eat", pronunciation: "KOO-la" },
        { swahili: "kunywa", chinese: "喝", english: "to drink", pronunciation: "koo-NYWA" },
        { swahili: "kulala", chinese: "睡觉", english: "to sleep", pronunciation: "koo-LA-la" },
        { swahili: "kusoma", chinese: "读/学习", english: "to read/study", pronunciation: "koo-SO-ma" },
        { swahili: "kuandika", chinese: "写", english: "to write", pronunciation: "koo-an-DEE-ka" },
        { swahili: "kwenda", chinese: "去", english: "to go", pronunciation: "KWEN-da" },
        { swahili: "kuja", chinese: "来", english: "to come", pronunciation: "KOO-ja" },
        { swahili: "kusema", chinese: "说", english: "to speak", pronunciation: "koo-SEH-ma" }
      ],
      phrases: [
        { swahili: "Ninakula chakula", chinese: "我在吃饭", english: "I am eating food", pronunciation: "nee-na-KOO-la cha-KOO-la" },
        { swahili: "Anasoma kitabu", chinese: "他/她在读书", english: "He/She is reading a book", pronunciation: "a-na-SO-ma kee-TA-boo" }
      ],
      grammar: {
        rule: "Present tense formed with: Subject + na + verb root. Example: Ni-na-kula (I am eating)",
        examples: [
          "Ninakula = I am eating",
          "Unakula = You are eating",
          "Anakula = He/She is eating"
        ]
      }
    }
  },
  {
    level: "beginner",
    title: "Days of the Week",
    titleSwahili: "Siku za Juma",
    titleChinese: "星期几",
    category: "Time",
    estimatedMinutes: 20,
    orderIndex: 7,
    content: {
      vocabulary: [
        { swahili: "Jumatatu", chinese: "星期一", english: "Monday", pronunciation: "joo-ma-TA-too" },
        { swahili: "Jumanne", chinese: "星期二", english: "Tuesday", pronunciation: "joo-MAN-neh" },
        { swahili: "Jumatano", chinese: "星期三", english: "Wednesday", pronunciation: "joo-ma-TA-noh" },
        { swahili: "Alhamisi", chinese: "星期四", english: "Thursday", pronunciation: "al-ha-MEE-see" },
        { swahili: "Ijumaa", chinese: "星期五", english: "Friday", pronunciation: "ee-joo-MAA" },
        { swahili: "Jumamosi", chinese: "星期六", english: "Saturday", pronunciation: "joo-ma-MO-see" },
        { swahili: "Jumapili", chinese: "星期日", english: "Sunday", pronunciation: "joo-ma-PEE-lee" }
      ],
      phrases: [
        { swahili: "Leo ni siku gani?", chinese: "今天星期几？", english: "What day is today?", pronunciation: "LEH-oh nee SEE-koo GA-nee" },
        { swahili: "Kesho ni Jumatatu", chinese: "明天是星期一", english: "Tomorrow is Monday", pronunciation: "KEH-shoh nee joo-ma-TA-too" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Food and Drinks",
    titleSwahili: "Chakula na Vinywaji",
    titleChinese: "食物和饮料",
    category: "Vocabulary",
    estimatedMinutes: 30,
    orderIndex: 8,
    content: {
      vocabulary: [
        { swahili: "chakula", chinese: "食物", english: "food", pronunciation: "cha-KOO-la" },
        { swahili: "maji", chinese: "水", english: "water", pronunciation: "MA-jee" },
        { swahili: "chai", chinese: "茶", english: "tea", pronunciation: "CHA-ee" },
        { swahili: "kahawa", chinese: "咖啡", english: "coffee", pronunciation: "ka-HA-wa" },
        { swahili: "mkate", chinese: "面包", english: "bread", pronunciation: "m-KA-teh" },
        { swahili: "nyama", chinese: "肉", english: "meat", pronunciation: "NYA-ma" },
        { swahili: "mboga", chinese: "蔬菜", english: "vegetables", pronunciation: "m-BO-ga" },
        { swahili: "matunda", chinese: "水果", english: "fruits", pronunciation: "ma-TOON-da" },
        { swahili: "wali", chinese: "米饭", english: "rice", pronunciation: "WA-lee" }
      ],
      phrases: [
        { swahili: "Napenda chakula cha Kichina", chinese: "我喜欢中国菜", english: "I like Chinese food", pronunciation: "na-PEN-da cha-KOO-la cha kee-CHEE-na" },
        { swahili: "Ninataka maji baridi", chinese: "我想要冰水", english: "I want cold water", pronunciation: "nee-na-TA-ka MA-jee ba-REE-dee" }
      ],
      dialogue: [
        { speaker: "Waiter", text: "Unataka nini?", translation: "What do you want?" },
        { speaker: "Customer", text: "Ninataka wali na nyama", translation: "I want rice and meat" },
        { speaker: "Waiter", text: "Kunywa nini?", translation: "What to drink?" },
        { speaker: "Customer", text: "Maji baridi, tafadhali", translation: "Cold water, please" }
      ]
    }
  },

  // MONTH 2 (Weeks 5-8)
  {
    level: "beginner",
    title: "Numbers 21-100",
    titleSwahili: "Namba 21-100",
    titleChinese: "数字21-100",
    category: "Numbers",
    estimatedMinutes: 25,
    orderIndex: 9,
    content: {
      vocabulary: [
        { swahili: "ishirini", chinese: "二十", english: "twenty", pronunciation: "ee-shee-REE-nee" },
        { swahili: "thelathini", chinese: "三十", english: "thirty", pronunciation: "the-la-THEE-nee" },
        { swahili: "arobaini", chinese: "四十", english: "forty", pronunciation: "a-ro-ba-EE-nee" },
        { swahili: "hamsini", chinese: "五十", english: "fifty", pronunciation: "ham-SEE-nee" },
        { swahili: "sitini", chinese: "六十", english: "sixty", pronunciation: "see-TEE-nee" },
        { swahili: "sabini", chinese: "七十", english: "seventy", pronunciation: "sa-BEE-nee" },
        { swahili: "themanini", chinese: "八十", english: "eighty", pronunciation: "the-ma-NEE-nee" },
        { swahili: "tisini", chinese: "九十", english: "ninety", pronunciation: "tee-SEE-nee" },
        { swahili: "mia", chinese: "一百", english: "hundred", pronunciation: "MEE-a" }
      ],
      phrases: [
        { swahili: "Bei ni shilingi hamsini", chinese: "价格是50先令", english: "The price is 50 shillings", pronunciation: "BEH-ee nee shee-LEEN-gee ham-SEE-nee" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Body Parts",
    titleSwahili: "Sehemu za Mwili",
    titleChinese: "身体部位",
    category: "Vocabulary",
    estimatedMinutes: 25,
    orderIndex: 10,
    content: {
      vocabulary: [
        { swahili: "kichwa", chinese: "头", english: "head", pronunciation: "kee-CHWA" },
        { swahili: "uso", chinese: "脸", english: "face", pronunciation: "OO-so" },
        { swahili: "jicho", chinese: "眼睛", english: "eye", pronunciation: "JEE-cho" },
        { swahili: "sikio", chinese: "耳朵", english: "ear", pronunciation: "see-KEE-o" },
        { swahili: "pua", chinese: "鼻子", english: "nose", pronunciation: "POO-a" },
        { swahili: "mdomo", chinese: "嘴", english: "mouth", pronunciation: "m-DO-mo" },
        { swahili: "mkono", chinese: "手/胳膊", english: "hand/arm", pronunciation: "m-KO-no" },
        { swahili: "mguu", chinese: "脚/腿", english: "foot/leg", pronunciation: "m-GOO" }
      ],
      phrases: [
        { swahili: "Kichwa kinauma", chinese: "头疼", english: "The head hurts", pronunciation: "kee-CHWA kee-na-OO-ma" },
        { swahili: "Nina macho mawili", chinese: "我有两只眼睛", english: "I have two eyes", pronunciation: "NEE-na MA-cho ma-WEE-lee" }
      ]
    }
  },
  {
    level: "beginner",
    title: "At Home",
    titleSwahili: "Nyumbani",
    titleChinese: "在家",
    category: "Conversation",
    estimatedMinutes: 30,
    orderIndex: 11,
    content: {
      vocabulary: [
        { swahili: "nyumba", chinese: "房子", english: "house", pronunciation: "NYOOM-ba" },
        { swahili: "chumba", chinese: "房间", english: "room", pronunciation: "CHOOM-ba" },
        { swahili: "jiko", chinese: "厨房", english: "kitchen", pronunciation: "JEE-ko" },
        { swahili: "choo", chinese: "厕所", english: "toilet/bathroom", pronunciation: "CHOH" },
        { swahili: "sebule", chinese: "客厅", english: "living room", pronunciation: "seh-BOO-leh" },
        { swahili: "kitanda", chinese: "床", english: "bed", pronunciation: "kee-TAN-da" },
        { swahili: "meza", chinese: "桌子", english: "table", pronunciation: "MEH-za" },
        { swahili: "kiti", chinese: "椅子", english: "chair", pronunciation: "KEE-tee" }
      ],
      phrases: [
        { swahili: "Nyumba yangu ni ndogo", chinese: "我的房子很小", english: "My house is small", pronunciation: "NYOOM-ba YAN-goo nee n-DOH-go" },
        { swahili: "Niko chumbani", chinese: "我在房间里", english: "I am in the room", pronunciation: "NEE-ko choom-BA-nee" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Telling Time",
    titleSwahili: "Kusema Saa",
    titleChinese: "说时间",
    category: "Time",
    estimatedMinutes: 30,
    orderIndex: 12,
    content: {
      vocabulary: [
        { swahili: "saa", chinese: "时间/小时", english: "hour/time", pronunciation: "SAA" },
        { swahili: "dakika", chinese: "分钟", english: "minute", pronunciation: "da-KEE-ka" },
        { swahili: "asubuhi", chinese: "早上", english: "morning", pronunciation: "a-soo-BOO-hee" },
        { swahili: "mchana", chinese: "下午", english: "afternoon", pronunciation: "m-CHA-na" },
        { swahili: "jioni", chinese: "傍晚", english: "evening", pronunciation: "jee-OH-nee" },
        { swahili: "usiku", chinese: "晚上/夜里", english: "night", pronunciation: "oo-SEE-koo" }
      ],
      phrases: [
        { swahili: "Saa ngapi?", chinese: "几点了？", english: "What time is it?", pronunciation: "SAA n-GA-pee" },
        { swahili: "Ni saa kumi asubuhi", chinese: "早上10点", english: "It's 10 o'clock morning", pronunciation: "nee SAA KOO-mee a-soo-BOO-hee" }
      ],
      grammar: {
        rule: "Swahili time is 12 hours ahead/behind Western time. 7am = saa moja (hour one), 1pm = saa saba (hour seven)",
        examples: [
          "7:00 AM = Saa moja asubuhi",
          "1:00 PM = Saa saba mchana",
          "7:00 PM = Saa moja jioni"
        ]
      }
    }
  },
  {
    level: "beginner",
    title: "Weather",
    titleSwahili: "Hali ya Hewa",
    titleChinese: "天气",
    category: "Conversation",
    estimatedMinutes: 25,
    orderIndex: 13,
    content: {
      vocabulary: [
        { swahili: "jua", chinese: "太阳", english: "sun", pronunciation: "JOO-a" },
        { swahili: "mvua", chinese: "雨", english: "rain", pronunciation: "m-VOO-a" },
        { swahili: "upepo", chinese: "风", english: "wind", pronunciation: "oo-PEH-po" },
        { swahili: "mawingu", chinese: "云", english: "clouds", pronunciation: "ma-WEEN-goo" },
        { swahili: "baridi", chinese: "冷", english: "cold", pronunciation: "ba-REE-dee" },
        { swahili: "joto", chinese: "热", english: "hot", pronunciation: "JOH-to" },
        { swahili: "vumbi", chinese: "灰尘", english: "dust", pronunciation: "VOOM-bee" }
      ],
      phrases: [
        { swahili: "Hali ya hewa ni nzuri", chinese: "天气很好", english: "The weather is good", pronunciation: "HA-lee ya HEH-wa nee n-ZOO-ree" },
        { swahili: "Kunanyesha mvua", chinese: "在下雨", english: "It's raining", pronunciation: "koo-na-nye-SHEH-sha m-VOO-a" },
        { swahili: "Leo kuna joto", chinese: "今天很热", english: "Today is hot", pronunciation: "LEH-oh KOO-na JOH-to" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Clothes",
    titleSwahili: "Nguo",
    titleChinese: "衣服",
    category: "Vocabulary",
    estimatedMinutes: 25,
    orderIndex: 14,
    content: {
      vocabulary: [
        { swahili: "nguo", chinese: "衣服", english: "clothes", pronunciation: "n-GOO-o" },
        { swahili: "shati", chinese: "衬衫", english: "shirt", pronunciation: "SHA-tee" },
        { swahili: "suruali", chinese: "裤子", english: "trousers", pronunciation: "soo-roo-A-lee" },
        { swahili: "vazi", chinese: "裙子", english: "dress", pronunciation: "VA-zee" },
        { swahili: "viatu", chinese: "鞋", english: "shoes", pronunciation: "vee-A-too" },
        { swahili: "kofia", chinese: "帽子", english: "hat", pronunciation: "ko-FEE-a" },
        { swahili: "soksi", chinese: "袜子", english: "socks", pronunciation: "SOK-see" }
      ],
      phrases: [
        { swahili: "Nguo hii ni nzuri", chinese: "这件衣服很好", english: "This cloth is nice", pronunciation: "n-GOO-o HEE nee n-ZOO-ree" },
        { swahili: "Ninataka kununua shati", chinese: "我想买衬衫", english: "I want to buy a shirt", pronunciation: "nee-na-TA-ka koo-noo-NOO-a SHA-tee" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Animals",
    titleSwahili: "Wanyama",
    titleChinese: "动物",
    category: "Vocabulary",
    estimatedMinutes: 25,
    orderIndex: 15,
    content: {
      vocabulary: [
        { swahili: "mnyama", chinese: "动物", english: "animal", pronunciation: "m-NYA-ma" },
        { swahili: "simba", chinese: "狮子", english: "lion", pronunciation: "SEEM-ba" },
        { swahili: "tembo", chinese: "大象", english: "elephant", pronunciation: "TEM-bo" },
        { swahili: "twiga", chinese: "长颈鹿", english: "giraffe", pronunciation: "TWEE-ga" },
        { swahili: "paka", chinese: "猫", english: "cat", pronunciation: "PA-ka" },
        { swahili: "mbwa", chinese: "狗", english: "dog", pronunciation: "m-BWA" },
        { swahili: "ndege", chinese: "鸟", english: "bird", pronunciation: "n-DEH-geh" },
        { swahili: "samaki", chinese: "鱼", english: "fish", pronunciation: "sa-MA-kee" }
      ],
      phrases: [
        { swahili: "Napenda wanyama", chinese: "我喜欢动物", english: "I like animals", pronunciation: "na-PEN-da wa-NYA-ma" },
        { swahili: "Nina mbwa mmoja", chinese: "我有一只狗", english: "I have one dog", pronunciation: "NEE-na m-BWA m-MO-ja" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Shopping Basics",
    titleSwahili: "Ununuzi wa Msingi",
    titleChinese: "基本购物",
    category: "Shopping",
    estimatedMinutes: 30,
    orderIndex: 16,
    content: {
      vocabulary: [
        { swahili: "duka", chinese: "商店", english: "shop", pronunciation: "DOO-ka" },
        { swahili: "bei", chinese: "价格", english: "price", pronunciation: "BEH-ee" },
        { swahili: "gharama", chinese: "费用", english: "cost", pronunciation: "gha-RA-ma" },
        { swahili: "kununua", chinese: "买", english: "to buy", pronunciation: "koo-noo-NOO-a" },
        { swahili: "kuuza", chinese: "卖", english: "to sell", pronunciation: "koo-OO-za" },
        { swahili: "punguzo", chinese: "折扣", english: "discount", pronunciation: "poon-GOO-zo" },
        { swahili: "pesa", chinese: "钱", english: "money", pronunciation: "PEH-sa" }
      ],
      phrases: [
        { swahili: "Bei gani?", chinese: "多少钱？", english: "How much?", pronunciation: "BEH-ee GA-nee" },
        { swahili: "Ni ghali sana", chinese: "太贵了", english: "It's too expensive", pronunciation: "nee GHA-lee SA-na" },
        { swahili: "Punguza bei", chinese: "降价", english: "Reduce the price", pronunciation: "poon-GOO-za BEH-ee" }
      ],
      dialogue: [
        { speaker: "Customer", text: "Hii bei gani?", translation: "How much is this?" },
        { speaker: "Seller", text: "Shilingi mia mbili", translation: "200 shillings" },
        { speaker: "Customer", text: "Ni ghali. Punguza kidogo", translation: "It's expensive. Reduce a little" },
        { speaker: "Seller", text: "Sawa, shilingi mia moja hamsini", translation: "Okay, 150 shillings" }
      ]
    }
  },

  // MONTH 3 (Weeks 9-12)
  {
    level: "beginner",
    title: "Transportation",
    titleSwahili: "Usafiri",
    titleChinese: "交通",
    category: "Travel",
    estimatedMinutes: 30,
    orderIndex: 17,
    content: {
      vocabulary: [
        { swahili: "gari", chinese: "汽车", english: "car", pronunciation: "GA-ree" },
        { swahili: "basi", chinese: "公共汽车", english: "bus", pronunciation: "BA-see" },
        { swahili: "pikipiki", chinese: "摩托车", english: "motorcycle", pronunciation: "pee-kee-PEE-kee" },
        { swahili: "baiskeli", chinese: "自行车", english: "bicycle", pronunciation: "ba-ee-SKEH-lee" },
        { swahili: "ndege", chinese: "飞机", english: "airplane", pronunciation: "n-DEH-geh" },
        { swahili: "treni", chinese: "火车", english: "train", pronunciation: "TREH-nee" },
        { swahili: "kituo", chinese: "车站", english: "station", pronunciation: "kee-TOO-o" }
      ],
      phrases: [
        { swahili: "Napanda gari", chinese: "我坐车", english: "I ride a car", pronunciation: "na-PAN-da GA-ree" },
        { swahili: "Naenda kwa basi", chinese: "我坐公交去", english: "I go by bus", pronunciation: "na-EN-da kwa BA-see" },
        { swahili: "Kituo kiko wapi?", chinese: "车站在哪里？", english: "Where is the station?", pronunciation: "kee-TOO-o KEE-ko WA-pee" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Basic Questions",
    titleSwahili: "Maswali ya Msingi",
    titleChinese: "基本问题",
    category: "Grammar",
    estimatedMinutes: 25,
    orderIndex: 18,
    content: {
      vocabulary: [
        { swahili: "nani", chinese: "谁", english: "who", pronunciation: "NA-nee" },
        { swahili: "nini", chinese: "什么", english: "what", pronunciation: "NEE-nee" },
        { swahili: "wapi", chinese: "哪里", english: "where", pronunciation: "WA-pee" },
        { swahili: "lini", chinese: "什么时候", english: "when", pronunciation: "LEE-nee" },
        { swahili: "kwa nini", chinese: "为什么", english: "why", pronunciation: "kwa NEE-nee" },
        { swahili: "vipi", chinese: "怎么样", english: "how", pronunciation: "VEE-pee" },
        { swahili: "ngapi", chinese: "多少", english: "how many", pronunciation: "n-GA-pee" }
      ],
      phrases: [
        { swahili: "Wewe ni nani?", chinese: "你是谁？", english: "Who are you?", pronunciation: "WEH-weh nee NA-nee" },
        { swahili: "Hii ni nini?", chinese: "这是什么？", english: "What is this?", pronunciation: "HEE nee NEE-nee" },
        { swahili: "Uko wapi?", chinese: "你在哪里？", english: "Where are you?", pronunciation: "OO-ko WA-pee" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Emotions and Feelings",
    titleSwahili: "Hisia",
    titleChinese: "情感和感受",
    category: "Conversation",
    estimatedMinutes: 25,
    orderIndex: 19,
    content: {
      vocabulary: [
        { swahili: "furaha", chinese: "快乐", english: "happy", pronunciation: "foo-RA-ha" },
        { swahili: "huzuni", chinese: "悲伤", english: "sad", pronunciation: "hoo-ZOO-nee" },
        { swahili: "hasira", chinese: "生气", english: "angry", pronunciation: "ha-SEE-ra" },
        { swahili: "hofu", chinese: "害怕", english: "fear", pronunciation: "HOH-foo" },
        { swahili: "uchovu", chinese: "疲劳", english: "tired", pronunciation: "oo-CHO-voo" },
        { swahili: "njaa", chinese: "饿", english: "hunger", pronunciation: "n-JAA" },
        { swahili: "kiu", chinese: "渴", english: "thirst", pronunciation: "KEE-oo" }
      ],
      phrases: [
        { swahili: "Ninafurahi sana", chinese: "我很开心", english: "I am very happy", pronunciation: "nee-na-foo-RA-hee SA-na" },
        { swahili: "Nimechoka", chinese: "我累了", english: "I am tired", pronunciation: "nee-meh-CHO-ka" },
        { swahili: "Nina njaa", chinese: "我饿了", english: "I am hungry", pronunciation: "NEE-na n-JAA" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Months and Seasons",
    titleSwahili: "Miezi na Majira",
    titleChinese: "月份和季节",
    category: "Time",
    estimatedMinutes: 25,
    orderIndex: 20,
    content: {
      vocabulary: [
        { swahili: "mwezi", chinese: "月", english: "month/moon", pronunciation: "MWEH-zee" },
        { swahili: "mwaka", chinese: "年", english: "year", pronunciation: "MWA-ka" },
        { swahili: "majira ya joto", chinese: "热季", english: "hot season", pronunciation: "ma-JEE-ra ya JOH-to" },
        { swahili: "majira ya baridi", chinese: "冷季", english: "cold season", pronunciation: "ma-JEE-ra ya ba-REE-dee" },
        { swahili: "majira ya mvua", chinese: "雨季", english: "rainy season", pronunciation: "ma-JEE-ra ya m-VOO-a" },
        { swahili: "majira ya kiangazi", chinese: "旱季", english: "dry season", pronunciation: "ma-JEE-ra ya kee-an-GA-zee" }
      ],
      phrases: [
        { swahili: "Tuko katika mwezi gani?", chinese: "我们在哪个月？", english: "What month are we in?", pronunciation: "TOO-ko ka-TEE-ka MWEH-zee GA-nee" },
        { swahili: "Mwaka huu ni 2025", chinese: "今年是2025年", english: "This year is 2025", pronunciation: "MWA-ka HOO nee elfu mbili ishirini na tano" }
      ]
    }
  },
  {
    level: "beginner",
    title: "School and Education",
    titleSwahili: "Shule na Elimu",
    titleChinese: "学校和教育",
    category: "Vocabulary",
    estimatedMinutes: 30,
    orderIndex: 21,
    content: {
      vocabulary: [
        { swahili: "shule", chinese: "学校", english: "school", pronunciation: "SHOO-leh" },
        { swahili: "mwalimu", chinese: "老师", english: "teacher", pronunciation: "mwa-LEE-moo" },
        { swahili: "mwanafunzi", chinese: "学生", english: "student", pronunciation: "mwa-na-FOON-zee" },
        { swahili: "kitabu", chinese: "书", english: "book", pronunciation: "kee-TA-boo" },
        { swahili: "kalamu", chinese: "笔", english: "pen", pronunciation: "ka-LA-moo" },
        { swahili: "karatasi", chinese: "纸", english: "paper", pronunciation: "ka-ra-TA-see" },
        { swahili: "darasa", chinese: "教室/班级", english: "classroom/class", pronunciation: "da-RA-sa" },
        { swahili: "masomo", chinese: "学科/课程", english: "subjects/studies", pronunciation: "ma-SO-mo" }
      ],
      phrases: [
        { swahili: "Ninasoma shuleni", chinese: "我在学校学习", english: "I study at school", pronunciation: "nee-na-SO-ma shoo-LEH-nee" },
        { swahili: "Mwalimu anafundisha Kiswahili", chinese: "老师教斯瓦希里语", english: "The teacher teaches Swahili", pronunciation: "mwa-LEE-moo a-na-foon-DEE-sha kee-swa-HEE-lee" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Hobbies and Interests",
    titleSwahili: "Mambo ya Kufurahisha",
    titleChinese: "爱好和兴趣",
    category: "Conversation",
    estimatedMinutes: 25,
    orderIndex: 22,
    content: {
      vocabulary: [
        { swahili: "kucheza", chinese: "玩/踢", english: "to play", pronunciation: "koo-CHEH-za" },
        { swahili: "mpira", chinese: "足球", english: "football/ball", pronunciation: "m-PEE-ra" },
        { swahili: "muziki", chinese: "音乐", english: "music", pronunciation: "moo-ZEE-kee" },
        { swahili: "kuimba", chinese: "唱歌", english: "to sing", pronunciation: "koo-EEM-ba" },
        { swahili: "kuchora", chinese: "画画", english: "to draw", pronunciation: "koo-CHO-ra" },
        { swahili: "kuogelea", chinese: "游泳", english: "to swim", pronunciation: "koo-o-geh-LEH-a" },
        { swahili: "safari", chinese: "旅行", english: "journey/travel", pronunciation: "sa-FA-ree" }
      ],
      phrases: [
        { swahili: "Napenda kucheza mpira", chinese: "我喜欢踢足球", english: "I like playing football", pronunciation: "na-PEN-da koo-CHEH-za m-PEE-ra" },
        { swahili: "Napenda kusikiza muziki", chinese: "我喜欢听音乐", english: "I like listening to music", pronunciation: "na-PEN-da koo-see-KEE-za moo-ZEE-kee" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Making Requests",
    titleSwahili: "Kuomba",
    titleChinese: "提出请求",
    category: "Grammar",
    estimatedMinutes: 25,
    orderIndex: 23,
    content: {
      vocabulary: [
        { swahili: "tafadhali", chinese: "请", english: "please", pronunciation: "ta-fa-DHA-lee" },
        { swahili: "kuomba", chinese: "请求/要", english: "to ask/request", pronunciation: "koo-OM-ba" },
        { swahili: "kutaka", chinese: "想要", english: "to want", pronunciation: "koo-TA-ka" },
        { swahili: "naomba", chinese: "我请求", english: "I request/please", pronunciation: "na-OM-ba" },
        { swahili: "nisaidie", chinese: "帮我", english: "help me", pronunciation: "nee-sa-ee-DEE-eh" }
      ],
      phrases: [
        { swahili: "Tafadhali nisaidie", chinese: "请帮我", english: "Please help me", pronunciation: "ta-fa-DHA-lee nee-sa-ee-DEE-eh" },
        { swahili: "Naomba maji", chinese: "我要水", english: "I request water/May I have water", pronunciation: "na-OM-ba MA-jee" },
        { swahili: "Naweza kukusaidia?", chinese: "我可以帮你吗？", english: "Can I help you?", pronunciation: "na-WEH-za koo-koo-sa-EE-dee-a" }
      ],
      grammar: {
        rule: "Use 'tafadhali' (please) to make polite requests. Use 'naomba' for formal requests.",
        examples: [
          "Naomba maji = I request water (formal)",
          "Tafadhali nisaidie = Please help me",
          "Naweza kusaidia? = Can I help?"
        ]
      }
    }
  },
  {
    level: "beginner",
    title: "Common Adjectives",
    titleSwahili: "Vivumishi vya Kawaida",
    titleChinese: "常用形容词",
    category: "Vocabulary",
    estimatedMinutes: 25,
    orderIndex: 24,
    content: {
      vocabulary: [
        { swahili: "kubwa", chinese: "大", english: "big", pronunciation: "koo-BWA" },
        { swahili: "ndogo", chinese: "小", english: "small", pronunciation: "n-DOH-go" },
        { swahili: "ndefu", chinese: "长", english: "long/tall", pronunciation: "n-DEH-foo" },
        { swahili: "fupi", chinese: "短", english: "short", pronunciation: "FOO-pee" },
        { swahili: "nzuri", chinese: "好", english: "good/beautiful", pronunciation: "n-ZOO-ree" },
        { swahili: "mbaya", chinese: "坏", english: "bad", pronunciation: "m-BA-ya" },
        { swahili: "mpya", chinese: "新", english: "new", pronunciation: "m-PYA" },
        { swahili: "zamani", chinese: "旧/古老", english: "old/ancient", pronunciation: "za-MA-nee" }
      ],
      phrases: [
        { swahili: "Nyumba kubwa", chinese: "大房子", english: "Big house", pronunciation: "NYOOM-ba koo-BWA" },
        { swahili: "Mti mrefu", chinese: "高树", english: "Tall tree", pronunciation: "m-TEE m-REH-foo" },
        { swahili: "Chakula kizuri", chinese: "好吃的食物", english: "Good food", pronunciation: "cha-KOO-la kee-ZOO-ree" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Places in Town",
    titleSwahili: "Maeneo Mjini",
    titleChinese: "城镇中的地方",
    category: "Vocabulary",
    estimatedMinutes: 30,
    orderIndex: 25,
    content: {
      vocabulary: [
        { swahili: "mjini", chinese: "城镇", english: "in town", pronunciation: "m-JEE-nee" },
        { swahili: "hospitali", chinese: "医院", english: "hospital", pronunciation: "ho-spee-TA-lee" },
        { swahili: "duka", chinese: "商店", english: "shop", pronunciation: "DOO-ka" },
        { swahili: "soko", chinese: "市场", english: "market", pronunciation: "SO-ko" },
        { swahili: "posta", chinese: "邮局", english: "post office", pronunciation: "POS-ta" },
        { swahili: "benki", chinese: "银行", english: "bank", pronunciation: "BEN-kee" },
        { swahili: "mkahawa", chinese: "餐厅", english: "restaurant", pronunciation: "m-ka-HA-wa" },
        { swahili: "hoteli", chinese: "酒店", english: "hotel", pronunciation: "ho-TEH-lee" }
      ],
      phrases: [
        { swahili: "Hospitali iko wapi?", chinese: "医院在哪里？", english: "Where is the hospital?", pronunciation: "ho-spee-TA-lee EE-ko WA-pee" },
        { swahili: "Naenda sokoni", chinese: "我去市场", english: "I'm going to the market", pronunciation: "na-EN-da so-KO-nee" }
      ]
    }
  },

  // Continue with more beginner lessons...
  {
    level: "beginner",
    title: "Possessives",
    titleSwahili: "Milki",
    titleChinese: "所有格",
    category: "Grammar",
    estimatedMinutes: 30,
    orderIndex: 26,
    content: {
      vocabulary: [
        { swahili: "yangu", chinese: "我的", english: "my/mine", pronunciation: "YAN-goo" },
        { swahili: "yako", chinese: "你的", english: "your/yours", pronunciation: "YA-ko" },
        { swahili: "yake", chinese: "他的/她的", english: "his/hers", pronunciation: "YA-keh" },
        { swahili: "yetu", chinese: "我们的", english: "our/ours", pronunciation: "YEH-too" },
        { swahili: "yenu", chinese: "你们的", english: "your (plural)", pronunciation: "YEH-noo" },
        { swahili: "yao", chinese: "他们的", english: "their/theirs", pronunciation: "YA-o" }
      ],
      phrases: [
        { swahili: "Kitabu changu", chinese: "我的书", english: "My book", pronunciation: "kee-TA-boo CHAN-goo" },
        { swahili: "Gari lake", chinese: "他的车", english: "His/Her car", pronunciation: "GA-ree LA-keh" },
        { swahili: "Nyumba yetu", chinese: "我们的房子", english: "Our house", pronunciation: "NYOOM-ba YEH-too" }
      ],
      grammar: {
        rule: "Possessives agree with the noun they modify. Different noun classes use different possessive forms.",
        examples: [
          "Kitabu changu (my book) - ki/vi class",
          "Gari langu (my car) - ji/ma class",
          "Nyumba yangu (my house) - n/n class"
        ]
      }
    }
  },
  {
    level: "beginner",
    title: "Location Words",
    titleSwahili: "Maneno ya Mahali",
    titleChinese: "位置词",
    category: "Vocabulary",
    estimatedMinutes: 25,
    orderIndex: 27,
    content: {
      vocabulary: [
        { swahili: "hapa", chinese: "这里", english: "here", pronunciation: "HA-pa" },
        { swahili: "pale", chinese: "那里", english: "there", pronunciation: "PA-leh" },
        { swahili: "ndani", chinese: "里面", english: "inside", pronunciation: "n-DA-nee" },
        { swahili: "nje", chinese: "外面", english: "outside", pronunciation: "n-JEH" },
        { swahili: "juu", chinese: "上面", english: "above/up", pronunciation: "JOO" },
        { swahili: "chini", chinese: "下面", english: "below/down", pronunciation: "CHEE-nee" },
        { swahili: "mbele", chinese: "前面", english: "in front", pronunciation: "m-BEH-leh" },
        { swahili: "nyuma", chinese: "后面", english: "behind", pronunciation: "NYOO-ma" },
        { swahili: "karibu", chinese: "附近", english: "near", pronunciation: "ka-REE-boo" },
        { swahili: "mbali", chinese: "远", english: "far", pronunciation: "m-BA-lee" }
      ],
      phrases: [
        { swahili: "Niko hapa", chinese: "我在这里", english: "I am here", pronunciation: "NEE-ko HA-pa" },
        { swahili: "Duka liko karibu", chinese: "商店在附近", english: "The shop is near", pronunciation: "DOO-ka LEE-ko ka-REE-boo" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Yes/No Questions",
    titleSwahili: "Maswali ya Ndiyo/Hapana",
    titleChinese: "是/否问题",
    category: "Grammar",
    estimatedMinutes: 25,
    orderIndex: 28,
    content: {
      vocabulary: [
        { swahili: "ndiyo", chinese: "是", english: "yes", pronunciation: "n-DEE-yo" },
        { swahili: "hapana", chinese: "不", english: "no", pronunciation: "ha-PA-na" },
        { swahili: "la", chinese: "不", english: "no (short form)", pronunciation: "LA" },
        { swahili: "ndio", chinese: "是的", english: "yes (short form)", pronunciation: "n-DEE-o" }
      ],
      phrases: [
        { swahili: "Je, unatoka China?", chinese: "你来自中国吗？", english: "Do you come from China?", pronunciation: "jeh, oo-na-TOH-ka CHEE-na" },
        { swahili: "Ndiyo, ninatoka China", chinese: "是的，我来自中国", english: "Yes, I come from China", pronunciation: "n-DEE-yo, nee-na-TOH-ka CHEE-na" },
        { swahili: "Je, unapenda chai?", chinese: "你喜欢茶吗？", english: "Do you like tea?", pronunciation: "jeh, oo-na-PEN-da CHA-ee" }
      ],
      grammar: {
        rule: "Start yes/no questions with 'Je' or use rising intonation. Answer with 'Ndiyo' (yes) or 'Hapana' (no).",
        examples: [
          "Je, wewe ni mwalimu? = Are you a teacher?",
          "Unapenda kahawa? = Do you like coffee?",
          "Ndiyo, napenda = Yes, I like it"
        ]
      }
    }
  },
  {
    level: "beginner",
    title: "Ordering Food",
    titleSwahili: "Kuagiza Chakula",
    titleChinese: "点餐",
    category: "Conversation",
    estimatedMinutes: 30,
    orderIndex: 29,
    content: {
      vocabulary: [
        { swahili: "kuagiza", chinese: "点菜", english: "to order", pronunciation: "koo-a-GEE-za" },
        { swahili: "mlo", chinese: "餐", english: "meal", pronunciation: "m-LOH" },
        { swahili: "menu", chinese: "菜单", english: "menu", pronunciation: "MEH-noo" },
        { swahili: "pilau", chinese: "香饭", english: "spiced rice", pronunciation: "pee-LA-oo" },
        { swahili: "ugali", chinese: "玉米糊", english: "cornmeal", pronunciation: "oo-GA-lee" },
        { swahili: "mchuzi", chinese: "炖菜", english: "stew/sauce", pronunciation: "m-CHOO-zee" }
      ],
      phrases: [
        { swahili: "Naagiza pilau na nyama", chinese: "我点香饭和肉", english: "I order spiced rice and meat", pronunciation: "na-a-GEE-za pee-LA-oo na NYA-ma" },
        { swahili: "Nipe menu", chinese: "给我菜单", english: "Give me the menu", pronunciation: "NEE-peh MEH-noo" }
      ],
      dialogue: [
        { speaker: "Waiter", text: "Karibu, unataka nini?", translation: "Welcome, what do you want?" },
        { speaker: "Customer", text: "Naagiza ugali na mchuzi wa samaki", translation: "I order ugali and fish stew" },
        { speaker: "Waiter", text: "Kunywa nini?", translation: "What to drink?" },
        { speaker: "Customer", text: "Soda baridi", translation: "Cold soda" }
      ]
    }
  },
  {
    level: "beginner",
    title: "Review and Practice",
    titleSwahili: "Marudio na Mazoezi",
    titleChinese: "复习和练习",
    category: "Review",
    estimatedMinutes: 40,
    orderIndex: 30,
    content: {
      vocabulary: [
        { swahili: "marudio", chinese: "复习", english: "review", pronunciation: "ma-roo-DEE-o" },
        { swahili: "mazoezi", chinese: "练习", english: "practice/exercise", pronunciation: "ma-zo-EH-zee" },
        { swahili: "kujifunza", chinese: "学习", english: "to learn", pronunciation: "koo-jee-FOON-za" }
      ],
      phrases: [
        { swahili: "Ninajifunza Kiswahili", chinese: "我在学斯瓦希里语", english: "I am learning Swahili", pronunciation: "nee-na-jee-FOON-za kee-swa-HEE-lee" },
        { swahili: "Tufanye mazoezi", chinese: "让我们练习", english: "Let's practice", pronunciation: "too-FAN-yeh ma-zo-EH-zee" }
      ],
      dialogue: [
        { speaker: "A", text: "Habari yako?", translation: "How are you?" },
        { speaker: "B", text: "Nzuri sana. Jina lako nani?", translation: "Very well. What's your name?" },
        { speaker: "A", text: "Jina langu ni Wang. Ninatoka Beijing. Wewe?", translation: "My name is Wang. I'm from Beijing. You?" },
        { speaker: "B", text: "Ninatoka Dar es Salaam. Karibu Tanzania!", translation: "I'm from Dar es Salaam. Welcome to Tanzania!" }
      ]
    }
  },

  // INTERMEDIATE LEVEL - MONTH 4 (Weeks 13-16)
  {
    level: "intermediate",
    title: "Past Tense Basics",
    titleSwahili: "Wakati Uliopita wa Msingi",
    titleChinese: "基本过去时",
    category: "Grammar",
    estimatedMinutes: 35,
    orderIndex: 31,
    content: {
      vocabulary: [
        { swahili: "jana", chinese: "昨天", english: "yesterday", pronunciation: "JA-na" },
        { swahili: "juzi", chinese: "前天", english: "day before yesterday", pronunciation: "JOO-zee" },
        { swahili: "wiki iliyopita", chinese: "上周", english: "last week", pronunciation: "WEE-kee ee-lee-yo-PEE-ta" },
        { swahili: "mwezi uliopita", chinese: "上个月", english: "last month", pronunciation: "MWEH-zee oo-lee-o-PEE-ta" }
      ],
      phrases: [
        { swahili: "Nilikula jana", chinese: "我昨天吃了", english: "I ate yesterday", pronunciation: "nee-lee-KOO-la JA-na" },
        { swahili: "Tulikwenda sokoni", chinese: "我们去了市场", english: "We went to the market", pronunciation: "too-lee-KWEN-da so-KO-nee" }
      ],
      grammar: {
        rule: "Past tense uses 'li' marker: Ni-li-kula (I ate). Pattern: Subject prefix + li + verb root",
        examples: [
          "Nilikula = I ate",
          "Ulikula = You ate",
          "Alikula = He/She ate",
          "Tulikula = We ate",
          "Mlikula = You (plural) ate",
          "Walikula = They ate"
        ]
      }
    }
  },
  {
    level: "intermediate",
    title: "At the Market",
    titleSwahili: "Sokoni",
    titleChinese: "在市场",
    category: "Shopping",
    estimatedMinutes: 30,
    orderIndex: 32,
    content: {
      vocabulary: [
        { swahili: "kupatana", chinese: "议价", english: "to bargain", pronunciation: "koo-pa-TA-na" },
        { swahili: "tofauti", chinese: "不同", english: "different", pronunciation: "to-fa-OO-tee" },
        { swahili: "aina", chinese: "种类", english: "type/kind", pronunciation: "A-ee-na" },
        { swahili: "kilo", chinese: "公斤", english: "kilogram", pronunciation: "KEE-lo" },
        { swahili: "nusu", chinese: "一半", english: "half", pronunciation: "NOO-soo" },
        { swahili: "robo", chinese: "四分之一", english: "quarter", pronunciation: "RO-bo" }
      ],
      phrases: [
        { swahili: "Ninataka kilo moja za nyanya", chinese: "我想要一公斤西红柿", english: "I want one kilo of tomatoes", pronunciation: "nee-na-TA-ka KEE-lo MO-ja za NYAN-ya" },
        { swahili: "Nipe punguzo", chinese: "给我打折", english: "Give me a discount", pronunciation: "NEE-peh poon-GOO-zo" }
      ],
      dialogue: [
        { speaker: "Buyer", text: "Mahindi bei gani kwa kilo?", translation: "How much is corn per kilo?" },
        { speaker: "Seller", text: "Shilingi elfu moja", translation: "1000 shillings" },
        { speaker: "Buyer", text: "Ni ghali. Punguza kidogo", translation: "It's expensive. Reduce a bit" },
        { speaker: "Seller", text: "Sawa, mia tisa", translation: "Okay, 900" }
      ]
    }
  },
  {
    level: "intermediate",
    title: "Asking for Directions",
    titleSwahili: "Kuuliza Njia",
    titleChinese: "问路",
    category: "Travel",
    estimatedMinutes: 30,
    orderIndex: 33,
    content: {
      vocabulary: [
        { swahili: "njia", chinese: "路", english: "way/road", pronunciation: "n-JEE-a" },
        { swahili: "kulia", chinese: "右边", english: "right", pronunciation: "koo-LEE-a" },
        { swahili: "kushoto", chinese: "左边", english: "left", pronunciation: "koo-SHO-to" },
        { swahili: "moja kwa moja", chinese: "直走", english: "straight ahead", pronunciation: "MO-ja kwa MO-ja" },
        { swahili: "kona", chinese: "角落", english: "corner", pronunciation: "KO-na" },
        { swahili: "barabara", chinese: "道路", english: "road/highway", pronunciation: "ba-ra-BA-ra" },
        { swahili: "kupita", chinese: "经过", english: "to pass", pronunciation: "koo-PEE-ta" }
      ],
      phrases: [
        { swahili: "Njiaya kwenda wapi?", chinese: "去哪里的路？", english: "Which way to go?", pronunciation: "n-JEE-a ya KWEN-da WA-pee" },
        { swahili: "Geuka kulia", chinese: "向右转", english: "Turn right", pronunciation: "geh-OO-ka koo-LEE-a" },
        { swahili: "Endelea moja kwa moja", chinese: "继续直走", english: "Continue straight", pronunciation: "en-deh-LEH-a MO-ja kwa MO-ja" }
      ],
      dialogue: [
        { speaker: "Tourist", text: "Samahani, hospitali iko wapi?", translation: "Excuse me, where is the hospital?" },
        { speaker: "Local", text: "Endelea moja kwa moja, kisha geuka kulia", translation: "Go straight, then turn right" },
        { speaker: "Tourist", text: "Ni mbali?", translation: "Is it far?" },
        { speaker: "Local", text: "Hapana, ni dakika tano tu", translation: "No, it's only 5 minutes" }
      ]
    }
  }
];

async function insertCurriculum() {
  console.log("Starting to insert curriculum lessons...");
  
  try {
    for (const lesson of curriculumLessons) {
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
      console.log(`✓ Inserted: ${lesson.titleChinese} (${lesson.titleSwahili})`);
    }
    
    console.log("\n✅ Successfully inserted all lessons!");
    console.log(`Total lessons added: ${curriculumLessons.length}`);
    
  } catch (error) {
    console.error("❌ Error inserting lessons:", error);
    throw error;
  }
}

insertCurriculum()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
