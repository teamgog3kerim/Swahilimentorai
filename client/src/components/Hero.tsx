import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/Chinese_learners_using_Swahili_app_148614f4.png";
import { ShareButton } from "@/components/ShareButton";
import { Link } from "wouter";
import { useLocale } from "@/lib/i18n";
import { APP_SLOGAN } from "@/lib/brand";

export function Hero() {
  const { t } = useLocale();

  return (
    <section className="relative isolate overflow-hidden bg-background pt-16">
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-background to-accent/[0.08]" />
        <div className="absolute -right-32 top-4 h-80 w-80 rounded-full bg-primary/[0.07] blur-3xl md:h-[28rem] md:w-[28rem]" />
        <div className="absolute -bottom-48 -left-28 h-96 w-96 rounded-full bg-accent/[0.09] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <div className="grid items-center gap-7 md:grid-cols-[1.02fr_0.98fr] md:gap-10 lg:gap-14">
          <div className="flex flex-col gap-5 md:gap-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:text-sm" data-testid="brand-slogan">{APP_SLOGAN}</p>
              <p className="mb-2 text-sm font-semibold tracking-wide text-primary">{t("探索两种重要的非洲语言")}</p>
              <h1 className="max-w-2xl text-[2rem] font-bold leading-[1.12] tracking-tight text-foreground [text-wrap:balance] sm:text-4xl lg:text-[3.25rem]">
                {t("学习")}
                <span className="mt-1.5 block text-primary">{t("阿姆哈拉语与斯瓦希里语")}</span>
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                {t("选择中文或英语界面，按自己的节奏学习，从字母、词汇到日常对话。")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3" role="group" aria-label={t("阿姆哈拉语与斯瓦希里语")}>
              <div className="rounded-xl border border-primary/15 bg-background/75 px-3.5 py-3 shadow-sm sm:px-4">
                <p className="text-lg font-semibold leading-tight text-primary sm:text-xl">አማርኛ</p>
                <p className="mt-1 text-sm text-foreground/75">{t("阿姆哈拉语")}</p>
              </div>
              <div className="rounded-xl border border-accent/25 bg-background/75 px-3.5 py-3 shadow-sm sm:px-4">
                <p className="text-lg font-semibold leading-tight text-foreground sm:text-xl">Kiswahili</p>
                <p className="mt-1 text-sm text-foreground/75">{t("斯瓦希里语")}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm leading-6 text-foreground/80">
              <span>{t("循序渐进课程")}</span>
              <span className="text-primary/50" aria-hidden="true">·</span>
              <span>{t("互动练习与自测")}</span>
              <span className="text-primary/50" aria-hidden="true">·</span>
              <span>{t("按语言分别保存进度")}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/65 px-3 py-1.5 text-sm text-foreground/80 shadow-sm backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                <span>{t("中文或英语界面")}</span>
              </span>
              <span className="text-sm text-muted-foreground">{t("引导课程与自测无需连接实时 AI。")}</span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button 
                size="lg" 
                className="text-base font-semibold" 
                data-testid="button-start-free"
                asChild
              >
                <Link href="/signup">{t("免费注册开始学习")}</Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-base font-semibold" 
                data-testid="button-view-pricing"
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              >
                {t("查看定价")}
              </Button>
              <ShareButton variant="ghost" size="lg" className="text-base font-semibold" />
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt={t("阿姆哈拉语与斯瓦希里语")}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
