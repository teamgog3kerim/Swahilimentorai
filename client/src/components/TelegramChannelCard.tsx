import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { SiTelegram } from "react-icons/si";

const TELEGRAM_CHANNEL_URL = "https://t.me/ethiopandalanguages";

interface TelegramChannelCardProps {
  className?: string;
}

export function TelegramChannelCard({ className = "" }: TelegramChannelCardProps) {
  const { t } = useLocale();

  return (
    <section
      aria-label={t("加入我们的Telegram频道")}
      data-telegram-channel-card
      className={`w-full rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-3 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <SiTelegram aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-snug">{t("加入我们的Telegram频道")}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("获取版本说明、帮助和团队答复。")}
          </p>
        </div>
      </div>
      <Button asChild size="sm" variant="outline" className="mt-3 w-full">
        <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
          {t("加入频道")}
        </a>
      </Button>
    </section>
  );
}
