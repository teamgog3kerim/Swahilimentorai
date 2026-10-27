import type { InsertLesson } from "../../shared/schema";
import { fidelFamilies, labializedLetters, vowelOrders } from "./amharicAlphabet";

type Entry = [term: string, transliteration: string, english: string, chinese: string];
type Bilingual = { english: string; chinese: string };
type Word = { term: string; swahili: string; transliteration: string; english: string; chinese: string };
const bi = (english: string, chinese: string): Bilingual => ({ english, chinese });
const word = ([term, transliteration, english, chinese]: Entry): Word => ({ term, swahili: term, transliteration, english, chinese });

function quiz(words: Word[]) {
  return words.slice(0, 6).map((entry, index) => {
    const distractors = words.filter((w) => w.term !== entry.term).slice(0, 3);
    const choices = [entry, ...distractors];
    const rotated = [...choices.slice(index % choices.length), ...choices.slice(0, index % choices.length)];
    return {
      question: bi(`Which expression means “${entry.english}”?`, `“${entry.chinese}”用阿姆哈拉语怎么表达？`),
      options: rotated.map((w) => w.term),
      answer: rotated.findIndex((w) => w.term === entry.term),
      explanation: bi(`${entry.term} (${entry.transliteration}) — ${entry.english}`, `${entry.term}（${entry.transliteration}）— ${entry.chinese}`),
    };
  });
}

const readingNotes = bi(
  "Read Ethiopic script from left to right. Transliteration is approximate: ä is a central vowel; ə is the sixth-order vowel and can be silent. ṭ, q, pʼ and chʼ involve ejective sounds. Some historical h, s and ts letters have merged in modern speech. Word stress and doubled consonants are not fully shown in this introductory transliteration.",
  "埃塞俄比亚文字从左向右书写。转写仅供辅助：ä 为央元音；ə 表示第六序元音，有时不发音。ṭ、q、pʼ、chʼ 涉及挤喉音。现代口语中，部分历史上的 h、s、ts 字母发音已合并。入门转写未完整标记重音和辅音延长。",
);

const alphabetLessons: InsertLesson[] = Array.from({ length: 7 }, (_, part) => {
  const families = fidelFamilies.slice(part * 5, part * 5 + 5);
  const letters = families.flatMap(([row, stem]) => Array.from(row).map((character, order) => ({
    character, transliteration: `${stem}${vowelOrders[order]}`,
  })));
  const selected = letters.filter((_, i) => i % 5 === 0).slice(0, 7);
  return {
    language: "amharic", level: "beginner", category: "letters", estimatedMinutes: 12,
    orderIndex: part, title: `Fidel foundations · ${part + 1}`, titleChinese: `基础字母 · 第${part + 1}课`,
    titleSwahili: `ፊደል · ${part + 1}`,
    content: {
      introduction: bi("Explore the seven vowel orders of each letter family. Tap a character, compare the reading aid, then test your recognition.", "探索每个字母系列的七个元音序。点击字母、对照转写，然后进行识字练习。"),
      letters, notes: readingNotes,
      quizzes: selected.map((entry, index) => ({
        question: bi(`Find the character read as “${entry.transliteration}”.`, `请选择读作“${entry.transliteration}”的字母。`),
        options: selected.map((s) => s.character), answer: index,
        explanation: bi(`${entry.character} is read ${entry.transliteration}.`, `${entry.character} 的辅助读音为 ${entry.transliteration}。`),
      })),
    },
  };
});

const wordSets: { title: string; chinese: string; native: string; level: string; words: Entry[] }[] = [
  { title: "Essential greetings", chinese: "常用问候", native: "ሰላምታ", level: "beginner", words: [
    ["ሰላም", "sälam", "Hello / peace", "你好／平安"], ["አመሰግናለሁ", "amäsäggənallähu", "Thank you", "谢谢"],
    ["እባክዎ", "əbbakwo", "Please (polite)", "请（礼貌用语）"], ["ይቅርታ", "yəqərta", "Excuse me / sorry", "对不起／打扰一下"],
    ["አዎ", "awo", "Yes", "是／好的"], ["አይ", "ay", "No", "不／不是"],
    ["ደህና ሁኑ", "dähna hunu", "Goodbye (polite)", "再见（礼貌用语）"], ["እንኳን ደህና መጡ", "ənkwan dähna mäṭṭu", "Welcome (polite)", "欢迎（礼貌用语）"],
  ] },
  { title: "People and family", chinese: "人物与家庭", native: "ቤተሰብ", level: "beginner", words: [
    ["እናት", "ənnat", "Mother", "母亲"], ["አባት", "abbat", "Father", "父亲"],
    ["ወንድም", "wändəm", "Brother", "兄弟"], ["እህት", "əhət", "Sister", "姐妹"],
    ["ልጅ", "ləj", "Child", "孩子"], ["ጓደኛ", "gwaddäñña", "Friend", "朋友"],
    ["ቤተሰብ", "betäsäb", "Family", "家庭"], ["ሰው", "säw", "Person", "人"],
  ] },
  { title: "Food and drink", chinese: "食物与饮料", native: "ምግብና መጠጥ", level: "beginner", words: [
    ["ውሃ", "wəha", "Water", "水"], ["ቡና", "bunna", "Coffee", "咖啡"],
    ["ሻይ", "shay", "Tea", "茶"], ["ወተት", "wätät", "Milk", "牛奶"],
    ["እንጀራ", "ənjära", "Injera (fermented flatbread)", "英吉拉（发酵薄饼）"], ["ዳቦ", "dabbo", "Bread", "面包"],
    ["ሩዝ", "ruz", "Rice", "米饭"], ["ምግብ", "məgəb", "Food", "食物"],
  ] },
  { title: "Everyday objects", chinese: "日常物品", native: "የዕለት ዕቃዎች", level: "beginner", words: [
    ["መጽሐፍ", "mätsʼhaf", "Book", "书"], ["እስክርቢቶ", "əskərbito", "Pen", "笔"],
    ["ስልክ", "səlk", "Telephone", "电话"], ["ጠረጴዛ", "ṭäräpʼeza", "Table", "桌子"],
    ["ወንበር", "wänbär", "Chair", "椅子"], ["ቁልፍ", "qulf", "Key", "钥匙"],
    ["ቦርሳ", "borsa", "Bag", "包"], ["ቤት", "bet", "House", "房子"],
  ] },
  { title: "Colors and descriptions", chinese: "颜色与描述", native: "ቀለማት", level: "beginner", words: [
    ["ቀይ", "qäy", "Red", "红色"], ["ሰማያዊ", "sämayawi", "Blue", "蓝色"],
    ["አረንጓዴ", "arängwade", "Green", "绿色"], ["ቢጫ", "bicha", "Yellow", "黄色"],
    ["ነጭ", "nächʼ", "White", "白色"], ["ጥቁር", "ṭəqur", "Black", "黑色"],
    ["ትልቅ", "tələq", "Big", "大的"], ["ትንሽ", "tənnəsh", "Small / a little", "小的／一点"],
  ] },
  { title: "Places and directions", chinese: "地点与方向", native: "ቦታና አቅጣጫ", level: "intermediate", words: [
    ["ገበያ", "gäbäya", "Market", "市场"], ["ሆቴል", "hotel", "Hotel", "酒店"],
    ["ትምህርት ቤት", "təmhərt bet", "School", "学校"], ["ሆስፒታል", "hospital", "Hospital", "医院"],
    ["ቀኝ", "qäñ", "Right", "右边"], ["ግራ", "gəra", "Left", "左边"],
    ["ቀጥታ", "qäṭṭəta", "Straight ahead", "直走"], ["አጠገብ", "aṭägäb", "Next to / nearby", "旁边／附近"],
  ] },
  { title: "Days and time", chinese: "日期与时间", native: "ቀናትና ጊዜ", level: "intermediate", words: [
    ["ዛሬ", "zare", "Today", "今天"], ["ነገ", "nägä", "Tomorrow", "明天"],
    ["ትናንት", "tənant", "Yesterday", "昨天"], ["ጠዋት", "ṭäwat", "Morning", "早晨"],
    ["ማታ", "mata", "Evening / night", "晚上"], ["ሰዓት", "säʼat", "Hour / clock", "小时／钟表"],
    ["ሰኞ", "säño", "Monday", "星期一"], ["እሁድ", "əhud", "Sunday", "星期日"],
  ] },
  { title: "Useful action words", chinese: "实用动作词", native: "ግሶች", level: "intermediate", words: [
    ["መሄድ", "mähed", "To go", "去"], ["መምጣት", "mämṭat", "To come", "来"],
    ["መብላት", "mäblat", "To eat", "吃"], ["መጠጣት", "mäṭäṭat", "To drink", "喝"],
    ["መማር", "mämar", "To learn", "学习"], ["መናገር", "mänagär", "To speak", "说话"],
    ["ማንበብ", "manbäb", "To read", "阅读"], ["መጻፍ", "mätsʼaf", "To write", "写"],
  ] },
];

const numberSets: { title: string; chinese: string; level: string; words: Entry[] }[] = [
  { title: "Numbers · zero to ten", chinese: "数字 · 零至十", level: "beginner", words: [
    ["ዜሮ", "zero", "Zero · 0", "零 · 0"], ["አንድ", "and", "One · 1 · ፩", "一 · 1 · ፩"],
    ["ሁለት", "hulätt", "Two · 2 · ፪", "二 · 2 · ፪"], ["ሦስት", "sost", "Three · 3 · ፫", "三 · 3 · ፫"],
    ["አራት", "arat", "Four · 4 · ፬", "四 · 4 · ፬"], ["አምስት", "aməst", "Five · 5 · ፭", "五 · 5 · ፭"],
    ["ስድስት", "sədəst", "Six · 6 · ፮", "六 · 6 · ፮"], ["ሰባት", "säbat", "Seven · 7 · ፯", "七 · 7 · ፯"],
    ["ስምንት", "səmənt", "Eight · 8 · ፰", "八 · 8 · ፰"], ["ዘጠኝ", "zäṭäñ", "Nine · 9 · ፱", "九 · 9 · ፱"],
    ["አስር", "asər", "Ten · 10 · ፲", "十 · 10 · ፲"],
  ] },
  { title: "Numbers · eleven to twenty", chinese: "数字 · 十一至二十", level: "beginner", words: [
    ["አስራ አንድ", "asra and", "Eleven · 11", "十一 · 11"], ["አስራ ሁለት", "asra hulätt", "Twelve · 12", "十二 · 12"],
    ["አስራ ሦስት", "asra sost", "Thirteen · 13", "十三 · 13"], ["አስራ አራት", "asra arat", "Fourteen · 14", "十四 · 14"],
    ["አስራ አምስት", "asra aməst", "Fifteen · 15", "十五 · 15"], ["አስራ ስድስት", "asra sədəst", "Sixteen · 16", "十六 · 16"],
    ["አስራ ሰባት", "asra säbat", "Seventeen · 17", "十七 · 17"], ["አስራ ስምንት", "asra səmənt", "Eighteen · 18", "十八 · 18"],
    ["አስራ ዘጠኝ", "asra zäṭäñ", "Nineteen · 19", "十九 · 19"], ["ሃያ", "haya", "Twenty · 20 · ፳", "二十 · 20 · ፳"],
  ] },
  { title: "Numbers · tens, hundreds and thousands", chinese: "数字 · 十、百与千", level: "intermediate", words: [
    ["ሠላሳ", "sälasa", "Thirty · 30 · ፴", "三十 · 30 · ፴"], ["አርባ", "arba", "Forty · 40 · ፵", "四十 · 40 · ፵"],
    ["ሃምሳ", "hamsa", "Fifty · 50 · ፶", "五十 · 50 · ፶"], ["ስልሳ", "səlsa", "Sixty · 60 · ፷", "六十 · 60 · ፷"],
    ["ሰባ", "säba", "Seventy · 70 · ፸", "七十 · 70 · ፸"], ["ሰማንያ", "sämaniya", "Eighty · 80 · ፹", "八十 · 80 · ፹"],
    ["ዘጠና", "zäṭäna", "Ninety · 90 · ፺", "九十 · 90 · ፺"], ["መቶ", "mäto", "One hundred · 100 · ፻", "一百 · 100 · ፻"],
    ["ሺ", "shih", "One thousand · 1,000", "一千 · 1,000"], ["አስር ሺ", "asər shih", "Ten thousand · 10,000 · ፼", "一万 · 10,000 · ፼"],
  ] },
];

const conversations: { title: string; chinese: string; native: string; level: string; lines: Entry[]; note: Bilingual }[] = [
  { title: "Meeting someone", chinese: "初次见面", native: "መተዋወቅ", level: "beginner", note: bi("ነዎት is polite. Start with polite forms when speaking with someone you do not know.", "ነዎት 是礼貌用法。与不熟悉的人交谈时，先使用礼貌形式。"), lines: [
    ["ሰላም። እንዴት ነዎት?", "sälam. əndet näwot?", "Hello. How are you? (polite)", "您好，您好吗？"],
    ["ደህና ነኝ። እርስዎስ?", "dähna näñ. ərsəwos?", "I am fine. And you? (polite)", "我很好。您呢？"],
    ["እኔም ደህና ነኝ።", "ənem dähna näñ", "I am fine too.", "我也很好。"],
    ["አመሰግናለሁ።", "amäsäggənallähu", "Thank you.", "谢谢。"],
  ] },
  { title: "Names and introductions", chinese: "姓名与自我介绍", native: "ስምና መግቢያ", level: "beginner", note: bi("Replace Li or Hana with your name. ስሜ means 'my name'.", "将 Li 或 Hana 替换成您的姓名。ስሜ 表示“我的名字”。"), lines: [
    ["ስምዎ ማን ነው?", "səmwo man näw?", "What is your name? (polite)", "您叫什么名字？"],
    ["ስሜ ሊ ነው።", "səme Li näw", "My name is Li.", "我的名字是李。"],
    ["ስሜ ሃና ነው።", "səme Hana näw", "My name is Hana.", "我的名字是哈娜。"],
    ["እንኳን ደህና መጡ።", "ənkwan dähna mäṭṭu", "Welcome! (polite)", "欢迎您！"],
  ] },
  { title: "Ordering coffee", chinese: "点咖啡", native: "ቡና ማዘዝ", level: "beginner", note: bi("እባክዎ makes a request polite. ያለ means 'without'.", "እባክዎ 用于礼貌请求。ያለ 表示“不加／没有”。"), lines: [
    ["አንድ ቡና እባክዎ።", "and bunna əbbakwo", "One coffee, please.", "请给我一杯咖啡。"],
    ["ከስኳር ጋር?", "käsəkwar gar?", "With sugar?", "加糖吗？"],
    ["ያለ ስኳር እባክዎ።", "yalä səkwar əbbakwo", "Without sugar, please.", "请不要加糖。"],
    ["እሺ።", "əshi", "All right.", "好的。"],
  ] },
  { title: "At the market", chinese: "在市场", native: "በገበያ", level: "intermediate", note: bi("Prices here are practice examples, not current market prices. ብር is the Ethiopian birr.", "这里的价格仅用于练习，并非实时市价。ብር 是埃塞俄比亚比尔。"), lines: [
    ["ይህ ስንት ነው?", "yəh sənt näw?", "How much is this?", "这个多少钱？"],
    ["ሃምሳ ብር ነው።", "hamsa bərr näw", "It is fifty birr.", "五十比尔。"],
    ["ሁለት እፈልጋለሁ።", "hulätt əfälləgallähu", "I would like two.", "我想要两个。"],
    ["አንድ መቶ ብር ነው።", "and mäto bərr näw", "It is one hundred birr.", "一百比尔。"],
  ] },
  { title: "Finding your way", chinese: "问路", native: "አቅጣጫ መጠየቅ", level: "intermediate", note: bi("የት means 'where'. Recognize direction words before attempting a longer request.", "የት 表示“哪里”。先熟悉方向词，再练习较长的问句。"), lines: [
    ["ይቅርታ፣ ሆቴሉ የት ነው?", "yəqərta, hotelu yät näw?", "Excuse me, where is the hotel?", "打扰一下，酒店在哪里？"],
    ["ቀጥታ ይሂዱ።", "qäṭṭəta yəhidu", "Go straight ahead. (polite)", "请直走。"],
    ["ከዚያ ወደ ቀኝ ይታጠፉ።", "käziya wädä qäñ yətaṭäfu", "Then turn right. (polite)", "然后请向右转。"],
    ["በጣም አመሰግናለሁ።", "bäṭam amäsäggənallähu", "Thank you very much.", "非常感谢。"],
  ] },
  { title: "Checking into a hotel", chinese: "酒店入住", native: "በሆቴል", level: "intermediate", note: bi("ለአንድ ሌሊት means 'for one night'. Practice changing the number of nights.", "ለአንድ ሌሊት 表示“住一晚”。试着更换住宿晚数。"), lines: [
    ["ክፍል አለ?", "kəfl allä?", "Is there a room available?", "有空房间吗？"],
    ["አዎ፣ አለ።", "awo, allä", "Yes, there is.", "是的，有。"],
    ["ለአንድ ሌሊት እፈልጋለሁ።", "läʼand lelit əfälləgallähu", "I would like it for one night.", "我想住一晚。"],
    ["እሺ፣ እንኳን ደህና መጡ።", "əshi, ənkwan dähna mäṭṭu", "All right, welcome.", "好的，欢迎您。"],
  ] },
  { title: "Talking about family", chinese: "谈论家庭", native: "ስለ ቤተሰብ", level: "intermediate", note: bi("አለዎት asks politely whether someone has something. አለኝ means 'I have'.", "አለዎት 用于礼貌询问是否拥有某物。አለኝ 表示“我有”。"), lines: [
    ["ወንድም አለዎት?", "wändəm alläwot?", "Do you have a brother? (polite)", "您有兄弟吗？"],
    ["አዎ፣ አንድ ወንድም አለኝ።", "awo, and wändəm alläñ", "Yes, I have one brother.", "是的，我有一个兄弟。"],
    ["እህትስ?", "əhəts?", "And a sister?", "那姐妹呢？"],
    ["ሁለት እህቶች አሉኝ።", "hulätt əhətoch alluñ", "I have two sisters.", "我有两个姐妹。"],
  ] },
  { title: "Planning a meeting", chinese: "约定见面", native: "ቀጠሮ", level: "intermediate", note: bi("Ethiopian clock conventions can differ by six hours. Confirm local versus international time and AM/PM; this lesson uses a day rather than an ambiguous clock time.", "埃塞俄比亚本地计时习惯可能相差六小时。请确认本地时间或国际时间以及上午／下午。本课使用日期，避免钟点歧义。"), lines: [
    ["ነገ እንገናኝ?", "nägä ənəggänañ?", "Shall we meet tomorrow?", "我们明天见面好吗？"],
    ["እሺ። የት?", "əshi. yät?", "All right. Where?", "好的。在哪里？"],
    ["በቡና ቤቱ።", "bäbunna betu", "At the coffee shop.", "在咖啡馆。"],
    ["እስከ ነገ።", "əskä nägä", "See you tomorrow.", "明天见。"],
  ] },
  { title: "At the clinic", chinese: "在诊所", native: "በሕክምና ቤት", level: "advanced", note: bi("These phrases teach communication, not medical advice. For urgent illness, seek qualified local care.", "这些短语用于语言交流，不构成医疗建议。如有紧急病情，请寻求当地专业医疗帮助。"), lines: [
    ["ዶክተር እፈልጋለሁ።", "dokter əfälləgallähu", "I need a doctor.", "我需要医生。"],
    ["ምን ሆኑ?", "mən honu?", "What happened? (polite)", "您怎么了？"],
    ["ራሴን ያመኛል።", "rasen yamäññal", "I have a headache.", "我头痛。"],
    ["እባክዎ እዚህ ይቀመጡ።", "əbbakwo əzih yəqämmäṭu", "Please sit here. (polite)", "请坐这里。"],
  ] },
  { title: "Learning and clarification", chinese: "学习与请求说明", native: "መማርና መጠየቅ", level: "advanced", note: bi("Use these requests whenever a speaker is too fast. ቀስ ብለው means 'slowly' in a polite instruction.", "当对方说得太快时，可以使用这些表达。ቀስ ብለው 在礼貌请求中表示“慢慢地”。"), lines: [
    ["አማርኛ እማራለሁ።", "amarəñña əmmarallähu", "I am learning Amharic.", "我正在学习阿姆哈拉语。"],
    ["በጣም ጥሩ።", "bäṭam ṭəru", "Very good.", "非常好。"],
    ["ቀስ ብለው ይናገሩ።", "qäs bəläw yənagäru", "Please speak slowly. (polite)", "请您说慢一点。"],
    ["እሺ፣ እንደገና እላለሁ።", "əshi, əndägäna əlallähu", "All right, I will say it again.", "好的，我再说一遍。"],
  ] },
  { title: "Work and everyday life", chinese: "工作与日常生活", native: "ሥራና ኑሮ", level: "advanced", note: bi("ነኝ follows a noun to mean 'I am'. Profession words can change with gender; these examples avoid assuming a learner's gender.", "名词后加 ነኝ 可表示“我是”。职业名称有时会随性别变化；本课避免预设学习者的性别。"), lines: [
    ["ተማሪ ነኝ።", "tämari näñ", "I am a student.", "我是一名学生。"],
    ["የት ይማራሉ?", "yät yəmmarallu?", "Where do you study? (polite)", "您在哪里学习？"],
    ["በአዲስ አበባ እማራለሁ።", "bäʼaddis abäba əmmarallähu", "I study in Addis Ababa.", "我在亚的斯亚贝巴学习。"],
    ["ትምህርቱ ጥሩ ነው።", "təmhərtu ṭəru näw", "The course is good.", "课程很好。"],
  ] },
  { title: "Asking for help", chinese: "寻求帮助", native: "እርዳታ መጠየቅ", level: "advanced", note: bi("Practice these phrases calmly. In an actual emergency, use official local emergency services; this lesson does not supply emergency telephone numbers.", "请平静地练习这些表达。实际遇到紧急情况时，请联系当地官方紧急服务；本课不提供紧急电话号码。"), lines: [
    ["እርዳታ እፈልጋለሁ።", "ərdata əfälləgallähu", "I need help.", "我需要帮助。"],
    ["ምን ሆነ?", "mən honä?", "What happened?", "发生什么事了？"],
    ["ስልኬ ጠፋ።", "səlke ṭäffa", "My phone is missing.", "我的手机丢了。"],
    ["ፖሊስ የት አለ?", "polis yät allä?", "Where can I find the police?", "在哪里能找到警察？"],
  ] },
];

export const amharicLessons: InsertLesson[] = [
  ...alphabetLessons,
  {
    language: "amharic", level: "intermediate", category: "letters", orderIndex: 7,
    title: "Beyond the basics · labialized syllables", titleChinese: "进阶字母 · 唇化音节", titleSwahili: "የፊደል ተጨማሪ ቅርጾች", estimatedMinutes: 15,
    content: {
      letters: labializedLetters.map(([character, transliteration]) => ({ character, transliteration })),
      introduction: bi("Explore additional w-colored syllables such as kwa, gwa and bwa. Not every family has every order.", "探索 kwa、gwa、bwa 等附加的唇化音节。并非每个系列都有全部元音序。"),
      notes: readingNotes,
      quizzes: [{ question: bi("Which character is read “kwa”?", "哪个字母读作“kwa”？"), options: ["ኳ", "ጓ", "ቋ", "ኋ"], answer: 0, explanation: bi("ኳ = kwa; ጓ = gwa; ቋ = qwa; ኋ = hwa.", "ኳ = kwa；ጓ = gwa；ቋ = qwa；ኋ = hwa。") }],
    },
  },
  ...wordSets.map((set, i) => {
    const vocabulary = set.words.map(word);
    return {
      language: "amharic", level: set.level, category: "words", orderIndex: 10 + i,
      title: set.title, titleChinese: set.chinese, titleSwahili: set.native, estimatedMinutes: 10,
      content: { vocabulary, quizzes: quiz(vocabulary), notes: readingNotes,
        introduction: bi("Read each word, reveal its meaning, and check what you remember. Say the word aloud before revealing the answer.", "阅读词语、揭示词义并检验记忆。在揭示答案前，先试着大声读出词语。") },
    };
  }),
  ...numberSets.map((set, i) => {
    const vocabulary = set.words.map(word);
    return {
      language: "amharic", level: set.level, category: "numbers", orderIndex: 20 + i,
      title: set.title, titleChinese: set.chinese, titleSwahili: "ቁጥሮች", estimatedMinutes: 12,
      content: { vocabulary, quizzes: quiz(vocabulary),
        introduction: bi("Connect number words with Arabic digits and traditional Ethiopic numerals. The traditional numeral system has no zero sign.", "将数字词与阿拉伯数字和传统埃塞俄比亚数字对应起来。传统数字系统没有零的符号。"),
        notes: bi("Build 21 as ሃያ አንድ (haya and). For 11–19, use አስራ followed by the unit. Common 1,000 is ሺ; traditional notation is ፲፻. Prices and phone numbers commonly use Arabic digits.", "21 为 ሃያ አንድ（haya and）。11–19 在个位数前加 አስራ。1000 常写作 ሺ；传统数字写作 ፲፻。价格和电话号码通常使用阿拉伯数字。") },
    };
  }),
  ...conversations.map((set, i) => {
    const vocabulary = set.lines.map(word);
    return {
      language: "amharic", level: set.level, category: "conversations", orderIndex: 30 + i,
      title: set.title, titleChinese: set.chinese, titleSwahili: set.native, estimatedMinutes: 15,
      content: { vocabulary, dialogues: [{ lines: vocabulary.map((entry, j) => ({ ...entry, speaker: j % 2 ? "B" : "A" })) }],
        quizzes: quiz(vocabulary), notes: set.note,
        introduction: bi("Read both roles, then cover the translation and practise your reply. Repeat the exchange until you can recall the phrases.", "分角色阅读，然后遮住翻译，练习回答。重复对话，直到能够回忆起这些表达。") },
    };
  }),
];
