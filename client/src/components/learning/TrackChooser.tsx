import { BookOpen, ArrowRight, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import type { TrackLanguage } from "@/contexts/TrackContext";

export function TrackChooser({ onChoose }: { onChoose: (track: TrackLanguage) => void }) {
  const { language } = useLocale();
  const english = language === "en";
  return (
    <section className="min-h-[72vh] px-5 py-12 md:px-10 flex items-center" data-testid="track-chooser">
      <div className="w-full max-w-5xl mx-auto">
        <div className="max-w-2xl mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary">
            <Languages className="h-4 w-4" /> {english ? "YOUR LEARNING PATH" : "选择你的学习路径"}
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
            {english ? "Which language will you open up today?" : "今天，想用哪种语言打开新世界？"}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {english ? "A focused path from script to real conversations. You can switch tracks any time." : "从文字入门，到真实交流。学习路径可随时切换。"}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {([
            { id: "amharic" as const, label: "አማርኛ", en: "Amharic", zh: "阿姆哈拉语", code: "AM", note: english ? "Read the Ethiopic script. Speak with confidence." : "读懂埃塞俄比亚文字，自信开口交流。" },
            { id: "swahili" as const, label: "Kiswahili", en: "Swahili", zh: "斯瓦希里语", code: "SW", note: english ? "Build practical East African conversations." : "掌握实用的东非日常会话。" },
          ]).map((item) => (
            <button key={item.id} onClick={() => onChoose(item.id)} data-testid={`button-choose-${item.id}`}
              className="group text-left rounded-3xl border border-border bg-card p-7 md:p-9 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <div className="flex items-start justify-between">
                <span className="rounded-2xl bg-primary/10 text-primary p-3"><BookOpen className="h-6 w-6" /></span>
                <span className="font-mono text-xs tracking-[.2em] text-muted-foreground">{item.code}</span>
              </div>
              <div className="mt-8 text-4xl font-semibold tracking-tight">{item.label}</div>
              <div className="mt-2 text-sm font-medium text-primary">{english ? item.en : item.zh}</div>
              <p className="mt-4 text-muted-foreground">{item.note}</p>
              <div className="mt-8 flex items-center gap-2 text-sm font-semibold">{english ? "Choose this path" : "开始这条路径"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
