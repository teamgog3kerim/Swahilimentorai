import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";

export function PronunciationButton({ text, targetLanguage }: {
  text: string; targetLanguage: "amharic" | "swahili";
}) {
  const { language } = useLocale();
  const [voice, setVoice] = useState<SpeechSynthesisVoice>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synthesis = window.speechSynthesis;
    const code = targetLanguage === "amharic" ? "am" : "sw";
    const update = () => setVoice(synthesis.getVoices().find((item) =>
      item.lang.toLowerCase().replace(/_/g, "-").split("-")[0] === code));
    update();
    synthesis.addEventListener("voiceschanged", update);
    return () => {
      synthesis.removeEventListener("voiceschanged", update);
      synthesis.cancel();
    };
  }, [targetLanguage]);
  useEffect(() => setFailed(false), [text]);

  return <div className="mt-3 space-y-1">
    <Button variant="outline" size="sm" disabled={!voice || !text} data-testid="button-pronunciation"
      onClick={() => {
        if (!voice) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.lang = voice.lang;
        utterance.rate = 0.8;
        utterance.onerror = () => setFailed(true);
        setFailed(false);
        window.speechSynthesis.speak(utterance);
      }}>
      <Volume2 className="mr-2 h-4 w-4" />{language === "en" ? "Listen" : "听发音"}
    </Button>
    {(!voice || failed) && <p className="text-xs text-muted-foreground" role="status">
      {failed
        ? (language === "en" ? "Pronunciation playback failed on this device." : "此设备未能播放发音。")
        : (language === "en" ? "Pronunciation audio is unavailable on this device. Use the transliteration as a reading aid." : "此设备暂无对应语言的发音语音。请参考中文释义、近似音及原文辅助阅读。")}
    </p>}
  </div>;
}
