import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import heroImage from "@assets/generated_images/Chinese_learners_using_Swahili_app_148614f4.png";
import { ShareButton } from "@/components/ShareButton";
import { Link } from "wouter";
import { useLocale } from "@/lib/i18n";
import { APP_SLOGAN } from "@/lib/brand";

export function Hero() {
  const { t } = useLocale();
  const features = [
    t("从字母到日常对话，循序渐进地学习"),
    t("互动练习与随堂自测，边学边巩固"),
    t("中文界面配有汉字近似读音提示"),
    t("两种语言的学习进度分别保存")
  ];

  return (
    <section className="relative isolate flex min-h-[100dvh] items-center overflow-hidden bg-background pt-16 md:pt-20">
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.09] via-background to-accent/[0.12]" />
        <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-primary/[0.08] blur-3xl md:h-[30rem] md:w-[30rem]" />
        <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-accent/[0.12] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 md:grid-cols-[1.04fr_0.96fr] md:gap-12 lg:gap-16">
          <div className="space-y-7 md:space-y-8">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary md:text-sm" data-testid="brand-slogan">{APP_SLOGAN}</p>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-bold leading-[1.12] tracking-tight text-foreground [text-wrap:balance] md:text-5xl lg:text-[3.5rem]">
                  {t("学习")}
                  <span className="mt-2 block text-primary">{t("阿姆哈拉语与斯瓦希里语")}</span>
                </h1>
                <p className="text-lg font-medium tracking-wide text-foreground/75 md:text-xl">
                  አማርኛ · Kiswahili
                </p>
              </div>
              <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                {t("选择中文或英语界面，按自己的节奏，从字母、单词和数字学到日常对话。")}
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/65 px-3.5 py-2 text-sm text-foreground/80 shadow-sm backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                <span>{t("界面语言可选中文或英语")}</span>
              </div>
            </div>

            <div className="space-y-3.5">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3.5 rounded-xl border border-primary/[0.08] bg-background/50 px-3.5 py-3 transition-transform duration-200 hover:translate-x-1 motion-reduce:transition-none motion-reduce:hover:translate-x-0">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-sm leading-6 text-foreground/85 md:text-base">{feature}</span>
                </div>
              ))}
            </div>

            <div className="border-l-2 border-primary/30 pl-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{t("开始很简单")}</p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {t("切换界面语言，选择阿姆哈拉语或斯瓦希里语，再从课程与练习开始。")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
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

            <p className="text-sm text-muted-foreground">
              {t("注册后即可选择学习语言；引导课程与自测无需连接实时 AI。")}
            </p>
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
