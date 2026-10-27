// The 33 basic Fidel families. The seven orders are ä, u, i, a, e, ə, o.
// Historical h/s/ts families remain distinct in writing, although several merge
// in modern pronunciation. Latin transliteration is a reading aid, not IPA.
export const fidelFamilies = [
  ["ሀሁሂሃሄህሆ", "h"], ["ለሉሊላሌልሎ", "l"],
  ["ሐሑሒሓሔሕሖ", "ḥ"], ["መሙሚማሜምሞ", "m"],
  ["ሠሡሢሣሤሥሦ", "ś"], ["ረሩሪራሬርሮ", "r"],
  ["ሰሱሲሳሴስሶ", "s"], ["ሸሹሺሻሼሽሾ", "sh"],
  ["ቀቁቂቃቄቅቆ", "q"], ["በቡቢባቤብቦ", "b"],
  ["ተቱቲታቴትቶ", "t"], ["ቸቹቺቻቼችቾ", "ch"],
  ["ኀኁኂኃኄኅኆ", "ḫ"], ["ነኑኒናኔንኖ", "n"],
  ["ኘኙኚኛኜኝኞ", "ny"], ["አኡኢኣኤእኦ", ""],
  ["ከኩኪካኬክኮ", "k"], ["ኸኹኺኻኼኽኾ", "kh"],
  ["ወዉዊዋዌውዎ", "w"], ["ዐዑዒዓዔዕዖ", "ʿ"],
  ["ዘዙዚዛዜዝዞ", "z"], ["ዠዡዢዣዤዥዦ", "zh"],
  ["የዩዪያዬይዮ", "y"], ["ደዱዲዳዴድዶ", "d"],
  ["ጀጁጂጃጄጅጆ", "j"], ["ገጉጊጋጌግጎ", "g"],
  ["ጠጡጢጣጤጥጦ", "ṭ"], ["ጨጩጪጫጬጭጮ", "chʼ"],
  ["ጰጱጲጳጴጵጶ", "pʼ"], ["ጸጹጺጻጼጽጾ", "tsʼ"],
  ["ፀፁፂፃፄፅፆ", "ṣ"], ["ፈፉፊፋፌፍፎ", "f"],
  ["ፐፑፒፓፔፕፖ", "p"],
] as const;

export const vowelOrders = ["ä", "u", "i", "a", "e", "ə", "o"];

export const labializedLetters = [
  ["ቈ", "qwä"], ["ቊ", "qwi"], ["ቋ", "qwa"], ["ቌ", "qwe"], ["ቍ", "qwə"],
  ["ኈ", "hwä"], ["ኊ", "hwi"], ["ኋ", "hwa"], ["ኌ", "hwe"], ["ኍ", "hwə"],
  ["ኰ", "kwä"], ["ኲ", "kwi"], ["ኳ", "kwa"], ["ኴ", "kwe"], ["ኵ", "kwə"],
  ["ጐ", "gwä"], ["ጒ", "gwi"], ["ጓ", "gwa"], ["ጔ", "gwe"], ["ጕ", "gwə"],
  ["ሏ", "lwa"], ["ሟ", "mwa"], ["ሯ", "rwa"], ["ሷ", "swa"], ["ሿ", "shwa"],
  ["ቧ", "bwa"], ["ቷ", "twa"], ["ቿ", "chwa"], ["ኗ", "nwa"], ["ኟ", "nywa"],
  ["ዟ", "zwa"], ["ዧ", "zhwa"], ["ዷ", "dwa"], ["ጇ", "jwa"], ["ጧ", "ṭwa"],
  ["ጯ", "chʼwa"], ["ጿ", "tsʼwa"], ["ፏ", "fwa"], ["ፗ", "pwa"],
] as const;
