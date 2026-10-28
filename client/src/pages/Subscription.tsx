import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookOpen, CheckCircle2, Clock3, Crown, ExternalLink, Languages, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BillingReadiness from "@/components/BillingReadiness";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/lib/i18n";
import type { Subscription, User } from "@shared/schema";
import { SUBSCRIPTION_PLANS } from "@shared/subscriptionPlans";

type PlansResponse = {
  provider: string;
  plans: Array<{ id: string }>;
  checkoutEnabled: boolean;
  environment: "sandbox" | string;
  configured: boolean;
  webhookConfigured: boolean;
  validated: boolean;
};

type PaymentStatus = { paid: boolean; hasCustomer: boolean };

async function postBillingRequest(path: string, body?: Record<string, string>) {
  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof result.code === "string" ? result.code : "request_failed");
  return result as { url?: string };
}

function safeSandboxUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const allowedHost = host === "sandbox.polar.sh"
      || host.endsWith(".sandbox.polar.sh")
      || host === "sandbox-buy.polar.sh";
    if (url.protocol !== "https:" || !allowedHost || url.username || url.password || url.port) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default function SubscriptionPage() {
  const { user } = useAuth() as { user: User | null };
  const { language, t } = useLocale();
  const isEnglish = language === "en";
  const queryClient = useQueryClient();
  const [checkoutError, setCheckoutError] = useState(false);
  const [portalError, setPortalError] = useState(false);
  const [pollingPayment, setPollingPayment] = useState(false);
  const [pollingExpired, setPollingExpired] = useState(false);
  const [confirmedPayment, setConfirmedPayment] = useState(false);
  const returnPayment = new URLSearchParams(window.location.search).get("payment");
  const returnReference = new URLSearchParams(window.location.search).get("reference");
  const isPaymentReturn = returnPayment === "success" && Boolean(returnReference);
  const {
    data: billing,
    isLoading: isBillingLoading,
    isError: isBillingError,
    refetch: refetchBilling,
  } = useQuery<PlansResponse>({ queryKey: ["/api/subscription/plans"] });
  const {
    data: paymentStatus,
    refetch: refetchPaymentStatus,
  } = useQuery<PaymentStatus>({
    queryKey: [returnReference
      ? `/api/subscription/payment-status?reference=${encodeURIComponent(returnReference)}`
      : "/api/subscription/payment-status"],
    enabled: Boolean(user),
    staleTime: 0,
    refetchInterval: pollingPayment && !pollingExpired ? 3000 : false,
  });
  const checkoutMutation = useMutation({
    mutationFn: (planId: "quarterly" | "semiannual") =>
      postBillingRequest("/api/subscription/checkout", { planId, locale: isEnglish ? "en" : "zh" }),
    onSuccess: (result) => {
      const url = safeSandboxUrl(result.url);
      if (url) window.location.assign(url);
      else setCheckoutError(true);
    },
    onError: () => setCheckoutError(true),
  });
  const portalMutation = useMutation({
    mutationFn: () => postBillingRequest("/api/subscription/portal"),
    onSuccess: (result) => {
      const url = safeSandboxUrl(result.url);
      if (url) window.location.assign(url);
      else setPortalError(true);
    },
    onError: () => setPortalError(true),
  });
  const {
    data: subscription,
    isLoading: isSubscriptionLoading,
    isError: isSubscriptionError,
    refetch: refetchSubscription,
  } = useQuery<Subscription>({ queryKey: ["/api/subscription"] });

  useEffect(() => {
    if (!isPaymentReturn || confirmedPayment || pollingExpired) return;
    setPollingPayment(true);
    setPollingExpired(false);
    const poll = window.setInterval(() => {
      void refetchPaymentStatus();
      void refetchSubscription();
      void queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }, 3000);
    const timeout = window.setTimeout(() => {
      setPollingPayment(false);
      setPollingExpired(true);
    }, 36_000);
    return () => {
      window.clearInterval(poll);
      window.clearTimeout(timeout);
    };
  }, [isPaymentReturn, confirmedPayment, pollingExpired, queryClient, refetchPaymentStatus, refetchSubscription]);

  useEffect(() => {
    if (!isPaymentReturn || !paymentStatus?.paid) return;
    setConfirmedPayment(true);
    setPollingPayment(false);
    void queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  }, [isPaymentReturn, paymentStatus?.paid, queryClient]);

  const now = new Date();
  const subscriptionEndsAt = user?.subscriptionEndsAt
    ? new Date(user.subscriptionEndsAt)
    : subscription?.endDate
      ? new Date(subscription.endDate)
      : null;
  const subscriptionEndDate = subscriptionEndsAt
    ? subscriptionEndsAt.toLocaleDateString(isEnglish ? "en-US" : "zh-CN")
    : null;
  const isExpired = subscriptionEndsAt !== null && subscriptionEndsAt <= now;
  const hoursRemaining = subscriptionEndsAt
    ? Math.max(0, Math.ceil((subscriptionEndsAt.getTime() - now.getTime()) / 3_600_000))
    : 0;
  const daysRemaining = subscriptionEndsAt ? differenceInDays(subscriptionEndsAt, now) : null;
  const isTrial = !subscription && subscriptionEndsAt !== null;
  const isExpiringSoon = !isExpired && daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 4;
  const isEntitled = Boolean(user?.isPremium);
  const hasActivePaidSubscription = Boolean(
    subscription?.status === "active" &&
    subscriptionEndsAt &&
    subscriptionEndsAt > now
  );
  const isSandboxReady = billing?.environment === "sandbox" && billing.checkoutEnabled === true;
  const isPlanAvailable = (id: string) => Boolean(billing?.plans?.some((plan) => plan.id === id));

  const quarterlyPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "quarterly")!;
  const semiannualPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === "semiannual")!;
  const sixMonthComparison = quarterlyPlan.amount * 2;
  const savings = sixMonthComparison - semiannualPlan.amount;
  const courseFeatures = isEnglish
    ? [
        "Full Amharic course",
        "Full Swahili course",
        "Letters, words and numbers",
        "Everyday conversations",
      ]
    : [
        "完整阿姆哈拉语课程",
        "完整斯瓦希里语课程",
        "字母、词汇与数字",
        "日常情境对话",
      ];

  const plans = [
    {
      id: "quarterly",
      title: isEnglish ? "Quarterly" : "季度方案",
      amount: quarterlyPlan.amount,
      currency: quarterlyPlan.currency,
      months: quarterlyPlan.months,
      subtitle: isEnglish
        ? "Billed every 3 months · 2 payments over 6 months"
        : "每3个月支付一次 · 6个月共支付2次",
      recommended: false,
    },
    {
      id: "semiannual",
      title: isEnglish ? "Six-month access" : "半年方案",
      amount: semiannualPlan.amount,
      currency: semiannualPlan.currency,
      months: semiannualPlan.months,
      subtitle: isEnglish ? "One payment for 6 months" : "一次支付，完整访问6个月",
      recommended: true,
    },
  ];

  return (
    <main className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {isEnglish ? "Your learning access" : "你的学习权限"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("订阅")}</h1>
        <p className="max-w-2xl text-muted-foreground">
          {isEnglish
            ? "One plan includes the complete Amharic and Swahili courses."
            : "每个方案均包含完整的阿姆哈拉语与斯瓦希里语课程。"}
        </p>
      </header>

      <div className="space-y-6">
        <Alert className="border-amber-600/30 bg-amber-500/[0.08]" data-testid="notice-sandbox-only">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>{isEnglish ? "Sandbox only — no real charges" : "仅限沙盒环境，不会产生真实扣款"}</AlertTitle>
          <AlertDescription>
            {isEnglish
              ? "Checkout uses Polar sandbox only. No live payments are enabled; choosing a plan does not itself grant or extend learning access."
              : "结账仅使用 Polar 沙盒环境，不支持真实付款。选择方案本身不会授予或延长学习权限。"}
          </AlertDescription>
        </Alert>

        {returnPayment === "canceled" && (
          <Alert data-testid="notice-checkout-canceled">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{isEnglish ? "Checkout canceled" : "结账已取消"}</AlertTitle>
            <AlertDescription>
              {isEnglish ? "No payment was confirmed. Your current learning access is unchanged." : "尚未确认付款，你当前的学习权限保持不变。"}
            </AlertDescription>
          </Alert>
        )}

        {isPaymentReturn && (
          <Alert data-testid="notice-payment-pending">
            {confirmedPayment ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
            <AlertTitle>
              {confirmedPayment
                ? isEnglish ? "Payment confirmed by the server" : "服务器已确认付款"
                : isEnglish ? "Confirming sandbox payment" : "正在确认沙盒付款"}
            </AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>
                {confirmedPayment
                  ? isEnglish
                    ? "Your account and subscription are being refreshed. Access changes only after server verification."
                    : "正在刷新账户和订阅信息。只有服务器验证后才会更新学习权限。"
                  : pollingExpired
                    ? isEnglish
                      ? "Confirmation is still pending. You can check again; access is not granted by this page."
                      : "仍在等待付款确认。你可以再次检查；本页面不会自行授予权限。"
                    : isEnglish
                      ? "Waiting for server confirmation. This can take a short while; access has not been changed locally."
                      : "正在等待服务器确认，可能需要一点时间；本页面不会自行更改学习权限。"}
              </span>
              {(pollingExpired || !pollingPayment) && !confirmedPayment && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPollingExpired(false);
                    setPollingPayment(true);
                    void refetchPaymentStatus();
                    void refetchSubscription();
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isEnglish ? "Check again" : "再次检查"}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {user?.isAdmin && <BillingReadiness />}

        {isBillingError && (
          <Alert variant="destructive" data-testid="alert-plans-error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{isEnglish ? "Could not load sandbox checkout availability" : "无法加载沙盒结账状态"}</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{isEnglish ? "Checkout stays disabled until availability is confirmed." : "确认结账状态前，结账功能将保持禁用。"}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetchBilling()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isEnglish ? "Retry" : "重试"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isSubscriptionLoading && (
          <Card aria-label={isEnglish ? "Loading subscription" : "正在加载订阅"}>
            <CardContent className="space-y-3 p-6">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        )}

        {isSubscriptionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{isEnglish ? "Could not load subscription details" : "无法加载订阅信息"}</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{isEnglish ? "Your learning access is not changed. Try again." : "你的学习权限未受影响，请重试。"}</span>
              <Button variant="outline" size="sm" onClick={() => void refetchSubscription()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isEnglish ? "Retry" : "重试"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!isSubscriptionLoading && !isSubscriptionError && isExpired && (
          <Alert variant="destructive" data-testid="alert-expired">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {isTrial
                ? isEnglish ? "Free trial ended" : "免费试用已结束"
                : t("订阅已过期")}
            </AlertTitle>
            <AlertDescription>
              {isEnglish
                ? <>Your learning access ended on {subscriptionEndDate}. {isSandboxReady ? "Sandbox checkout is available; access changes only after server verification." : "Sandbox checkout is not ready; no payment or access change has been made."}</>
                : <>你的学习权限已于 {subscriptionEndDate} 到期。{isSandboxReady ? "沙盒结账已开放；只有服务器验证后才会更新权限。" : "沙盒结账尚未就绪，不会扣款或更改权限。"}</>}
            </AlertDescription>
          </Alert>
        )}

        {!isSubscriptionLoading && !isSubscriptionError && isExpiringSoon && (
          <Alert data-testid="alert-expiring-soon">
            <Clock3 className="h-4 w-4" />
            <AlertTitle>{isTrial ? t("88小时免费试用") : t("订阅即将到期")}</AlertTitle>
            <AlertDescription>
              {isEnglish
                ? <>Your current learning access expires in {hoursRemaining} hours. {isSandboxReady ? "Sandbox checkout is available." : "Sandbox checkout is not ready yet."}</>
                : <>你当前的学习权限将在 {hoursRemaining} 小时后到期。{isSandboxReady ? "沙盒结账已开放。" : "沙盒结账尚未就绪。"}</>}
            </AlertDescription>
          </Alert>
        )}

        {!isSubscriptionLoading && !isSubscriptionError && isEntitled && subscriptionEndsAt && (
          <Card
            className={isExpiringSoon ? "border-amber-500/50" : "border-primary/40"}
            data-testid="card-current-subscription"
          >
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {isTrial ? t("88小时免费试用") : t("当前订阅")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {isExpired
                      ? t("已过期")
                      : isEnglish
                        ? `${hoursRemaining} hours of access remaining`
                        : `学习权限还剩 ${hoursRemaining} 小时`}
                  </CardDescription>
                </div>
                <Badge variant={isExpired ? "destructive" : isExpiringSoon ? "outline" : "default"}>
                  {isExpired ? t("已过期") : isExpiringSoon ? t("即将到期") : t("活跃")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/60 p-4">
                  <p className="text-xs text-muted-foreground">{t("到期日期")}</p>
                  <p className="mt-1 font-semibold">{subscriptionEndDate}</p>
                </div>
                <div className="rounded-lg bg-muted/60 p-4">
                  <p className="text-xs text-muted-foreground">
                    {isEnglish ? "Access remaining" : "剩余学习权限"}
                  </p>
                  <p className="mt-1 font-semibold">
                    {isExpired ? t("已过期") : `${hoursRemaining} ${isEnglish ? "hours" : "小时"}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  {isEnglish
                    ? "Your existing learning access remains as recorded. Plan checkout will not change or extend it while payment is unavailable."
                    : "当前学习权限按现有记录保留。付费结账开放前，方案不会更改或延长现有权限。"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {subscription && (
          <Card className="bg-muted/30" data-testid="card-subscription-record">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">{isEnglish ? "Recorded subscription status" : "已记录的订阅状态"}</p>
                <p className="text-xs text-muted-foreground">
                  {isEnglish ? "End date" : "到期日期"}: {new Date(subscription.endDate).toLocaleDateString(isEnglish ? "en-US" : "zh-CN")}
                </p>
              </div>
              <Badge variant={subscription.status === "active" ? "secondary" : "outline"}>
                {subscription.status}
              </Badge>
            </CardContent>
          </Card>
        )}

        <section aria-labelledby="available-plans-heading" className="space-y-4">
          <div>
            <h2 id="available-plans-heading" className="text-xl font-bold">
              {isEnglish ? "Available plans" : "可选方案"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEnglish
                ? "Both plans unlock every course in both languages."
                : "两个方案均可访问两种语言的全部课程。"}
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.recommended ? "border-primary/50" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-xl">{plan.title}</CardTitle>
                    {plan.recommended && (
                      <Badge><Crown className="mr-1 h-3 w-3" />{isEnglish ? `Save USD ${savings}` : `节省 USD ${savings}`}</Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 pt-2">
                    <span className="text-4xl font-bold">{plan.amount}</span>
                    <span className="text-lg font-semibold text-muted-foreground">{plan.currency}</span>
                    <span className="text-sm text-muted-foreground">/ {plan.months} {isEnglish ? "months" : "个月"}</span>
                  </div>
                  <CardDescription>{plan.subtitle}</CardDescription>
                  {plan.id === "semiannual" && (
                    <p className="text-sm font-medium text-primary">
                      {isEnglish
                        ? `Save USD ${savings} versus two quarterly payments (USD ${sixMonthComparison}).`
                        : `比支付两次季度方案节省 USD ${savings}（合计 USD ${sixMonthComparison}）。`}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator />
                  <ul className="space-y-3">
                    {courseFeatures.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    className="w-full"
                    size="lg"
                    disabled={!isSandboxReady || !isPlanAvailable(plan.id) || checkoutMutation.isPending || isBillingLoading}
                    onClick={() => {
                      setCheckoutError(false);
                      checkoutMutation.mutate(plan.id as "quarterly" | "semiannual");
                    }}
                    data-testid={`button-subscribe-${plan.id}`}
                  >
                    {checkoutMutation.isPending
                      ? isEnglish ? "Opening secure checkout…" : "正在打开安全结账…"
                      : isSandboxReady && isPlanAvailable(plan.id)
                        ? isEnglish ? "Continue to sandbox checkout" : "前往沙盒结账"
                        : isEnglish ? "Sandbox checkout not ready" : "沙盒结账尚未就绪"}
                  </Button>
                  {checkoutError && (
                    <p role="alert" className="text-sm text-destructive">
                      {isEnglish ? "Could not start checkout. Please try again." : "无法启动结账，请重试。"}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {isBillingLoading && (
          <div className="space-y-3 rounded-xl border p-4" aria-label={isEnglish ? "Loading checkout availability" : "正在加载结账状态"} aria-busy="true">
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
        )}

        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <Languages className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            {isEnglish
              ? isSandboxReady
                ? "Checkout runs in sandbox only. No real charges are possible. Choosing a plan does not change access until payment is verified server-side."
                : "Sandbox checkout is not ready. No payment is collected, and choosing a plan does not grant or extend access."
              : isSandboxReady
                ? "结账仅在沙盒环境进行，不会产生真实扣款。付款经服务器验证前，选择方案不会更改学习权限。"
                : "沙盒结账尚未就绪，不会收取费用；选择方案不会授予或延长学习权限。"}
          </p>
        </div>

        {paymentStatus?.hasCustomer && (
          <div className="space-y-2 text-center">
            <Button
              type="button"
              variant="outline"
              disabled={portalMutation.isPending}
              onClick={() => {
                setPortalError(false);
                portalMutation.mutate();
              }}
              data-testid="button-subscription-portal"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {portalMutation.isPending
                ? isEnglish ? "Opening account portal…" : "正在打开账户管理…"
                : isEnglish ? "Manage subscription" : "管理订阅"}
            </Button>
            {portalError && (
              <p role="alert" className="text-sm text-destructive">
                {isEnglish ? "Could not open the subscription portal. Please try again." : "无法打开订阅管理页面，请重试。"}
              </p>
            )}
          </div>
        )}

        {hasActivePaidSubscription && (
          <p className="text-center text-xs text-muted-foreground">
            {isEnglish
              ? "Your active subscription record is unchanged."
              : "你的现有活跃订阅记录保持不变。"}
          </p>
        )}
      </div>
    </main>
  );
}
