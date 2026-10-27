import { UserPlus, Target, MessageCircle, TrendingUp } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function HowItWorks() {
  const { t } = useLocale();
  const steps = [
    {
      number: "1",
      icon: UserPlus,
      title: t("注册账号"),
      titleSwahili: "Jisajili",
      description: t("只需几秒钟即可创建免费账号，开始你的学习之旅")
    },
    {
      number: "2",
      icon: Target,
      title: t("选择语言与级别"),
      titleSwahili: "Chagua Kiwango",
      description: t("选择阿姆哈拉语或斯瓦希里语，并从适合您的级别开始")
    },
    {
      number: "3",
      icon: MessageCircle,
      title: t("互动练习与随堂自测"),
      titleSwahili: "Fanya Mazoezi",
      description: t("通过字母卡片、词汇翻卡和情景对话，在自己的节奏下练习")
    },
    {
      number: "4",
      icon: TrendingUp,
      title: t("追踪进度"),
      titleSwahili: "Fuatilia Maendeleo",
      description: t("查看详细的学习数据，见证自己的成长和进步")
    }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">{t("如何开始学习")}</h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            {t("四步开始您的语言学习之旅")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative" data-testid={`step-${index}`}>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{step.titleSwahili}</p>
                  <p className="text-base text-foreground/80">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-border -translate-x-1/2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
