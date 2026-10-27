import { useLocale } from "@/lib/i18n";
import { chineseAmharicReading, chineseReadingNote } from "@shared/amharicPronunciation";

export function ReadingAid({ native, latin, chinese, target, compact = false }: {
  native: string; latin?: string; chinese?: string; target: string; compact?: boolean;
}) {
  const { language } = useLocale();
  const reading = language === "en" ? latin
    : chinese || (target === "amharic" ? chineseAmharicReading(native) : undefined);
  if (!reading) return null;
  return <span className={compact ? "block text-[10px] text-muted-foreground" : "block mt-1 text-sm text-primary"}
    data-testid="pronunciation-guide" data-reading-language={language} lang={language === "en" ? "en" : "zh-CN"}
    title={language === "zh" ? chineseReadingNote : undefined}>
    {language === "zh" && !compact && <span>中文近似音：</span>}{compact ? reading.replace(/（第(.)序）/g, "·$1").replace("（挤喉）", "·挤") : reading}
  </span>;
}

export function ChineseReadingNotice({ target }: { target: string }) {
  const { language } = useLocale();
  return language === "zh" && target === "amharic"
    ? <p className="text-xs leading-relaxed text-muted-foreground" data-testid="chinese-reading-notice">{chineseReadingNote}</p>
    : null;
}
