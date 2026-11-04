import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useLocale();
  const nextLanguage = language === "zh" ? "en" : "zh";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => setLanguage(nextLanguage)}
      aria-label={language === "zh" ? "Switch language to English" : "切换界面语言为中文"}
      title={language === "zh" ? "Switch language to English" : "切换界面语言为中文"}
      data-testid="button-language"
    >
      <Languages className="mr-1 h-4 w-4" />
      {language === "zh" ? "EN" : "中文"}
    </Button>
  );
}
