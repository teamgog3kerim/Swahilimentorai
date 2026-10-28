import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Crown, Clock3, Languages } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { BILLING_PROVIDER, SUBSCRIPTION_PLANS } from "@shared/subscriptionPlans";
import { rememberSubscriptionIntent } from "@/lib/subscriptionIntent";

type PricingProps = {
  onSubscribe?: () => void;
};

export function Pricing({ onSubscribe }: PricingProps) {
  const { language, t } = useLocale();
  const isEnglish = language === "en";
  const quarterlyPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "quarterly")!;
  const semiannualPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "semiannual")!;
  const sixMonthQuarterlyTotal = quarterlyPlan.amount * 2;
  const savings = sixMonthQuarterlyTotal - semiannualPlan.amount;

  const handleSubscription = () => {
    rememberSubscriptionIntent();
    window.location.assign("/login");
  };

  const handleTrialSignup = () => {
    if (onSubscribe) {
      onSubscribe();
      return;
    }
    window.location.href = "/signup";
  };

  const courseFeatures = isEnglish
    ? [
        "Complete Amharic course",
        "Complete Swahili course",
        "Letters, words and numbers",
        "Everyday conversations",
        "For Chinese- and English-speaking learners",
      ]
    : [
        "完整阿姆哈拉语课程",
        "完整斯瓦希里语课程",
        "字母、词汇与数字",
        "日常情境对话",
        "面向中文和英语学习者",
      ];

  const plans = [
    {
      id: "quarterly",
      name: isEnglish ? "Quarterly" : "季度方案",
      plan: quarterlyPlan,
      description: isEnglish
        ? "Billed every 3 months · 2 payments over 6 months"
        : "每3个月支付一次 · 6个月共支付2次",
      testId: "button-subscribe-quarterly",
      featured: false,
    },
    {
      id: "semiannual",
      name: isEnglish ? "Six-month access" : "半年方案",
      plan: semiannualPlan,
      description: isEnglish
        ? "One payment · full course access for 6 months"
        : "一次支付 · 完整课程访问6个月",
      testId: "button-subscribe-semiannual",
      featured: true,
    },
  ];

  return (
    <section id="pricing" className="bg-muted/30 py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
        <header className="mb-10 space-y-4 text-center md:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {isEnglish ? "A complete language journey" : "完整语言学习之旅"}
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("订阅计划")}</h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            {isEnglish
              ? "Learn both Amharic and Swahili, from first letters to real conversations."
              : "同时学习阿姆哈拉语与斯瓦希里语，从字母入门到真实对话。"}
          </p>
          <div className="mx-auto flex max-w-fit flex-wrap items-center justify-center gap-2 rounded-full border bg-background/70 px-4 py-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4 text-primary" />
            <span>{isEnglish ? "Start with an 88-hour free trial · no upfront payment" : "先体验88小时免费试用 · 无需预付款"}</span>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {plans.map(({ id, name, plan, description, testId, featured }) => (
            <Card
              key={id}
              className={`relative overflow-hidden ${featured ? "border-primary/50 shadow-md" : ""}`}
            >
              {featured && <div className="absolute inset-x-0 top-0 h-1 bg-primary" />}
              <CardHeader className="relative pb-5">
                <div className="mb-2 flex min-h-7 items-center justify-between gap-2">
                  <Badge variant={featured ? "default" : "secondary"}>
                    {featured ? (
                      <><Crown className="mr-1 h-3 w-3" />{isEnglish ? "Save USD 8" : "节省 USD 8"}</>
                    ) : isEnglish ? "Flexible" : "灵活选择"}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground">
                    {plan.months} {isEnglish ? "months" : "个月"}
                  </span>
                </div>
                <CardTitle className="text-xl md:text-2xl">{name}</CardTitle>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight md:text-5xl">{plan.amount}</span>
                  <span className="text-xl font-semibold text-muted-foreground">{plan.currency}</span>
                </div>
                <p className="mt-2 min-h-10 text-sm leading-6 text-muted-foreground">{description}</p>
                {id === "semiannual" && (
                  <p className="text-sm font-medium text-primary">
                    {isEnglish
                      ? `USD ${savings} less than two quarterly payments (USD ${sixMonthQuarterlyTotal})`
                      : `比两个季度方案少 USD ${savings}（原计 USD ${sixMonthQuarterlyTotal}）`}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3 border-t pt-5">
                  {courseFeatures.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubscription}
                  data-testid={testId}
                  aria-describedby="pricing-checkout-notice"
                >
                  {isEnglish ? "View subscription options" : "查看订阅选项"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div
          id="pricing-checkout-notice"
          className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"
          role="note"
        >
          <Languages className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="leading-relaxed text-muted-foreground">
            {isEnglish
              ? `Sign in to view subscription options. Live USD payments via ${BILLING_PROVIDER} are not available yet. Any available sandbox checkout is for testing only, with no real charges.`
              : `登录后查看订阅选项。${BILLING_PROVIDER} 的 USD 正式支付尚未开放；可用的沙盒结账仅供测试，不会实际扣款。`}
          </p>
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" size="lg" onClick={handleTrialSignup}>
            {isEnglish ? "Start your 88-hour free trial" : "开始88小时免费试用"}
          </Button>
        </div>
      </div>
    </section>
  );
}
