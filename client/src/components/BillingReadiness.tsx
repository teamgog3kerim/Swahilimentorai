import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, CircleDashed, RefreshCw, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";

type BillingCheckId =
  | "access_token"
  | "webhook_secret"
  | "quarterly_product"
  | "six_month_product"
  | "checkout_implementation"
  | "verified_webhooks"
  | "sandbox_payment_test";

type BillingReadinessResponse = {
  provider: "Polar.sh";
  checkoutEnabled: false;
  status: "not_connected";
  checks: { id: BillingCheckId; complete: boolean }[];
  products: unknown[];
};

const checkCopy: Record<BillingCheckId, { en: string; zh: string; setting: boolean }> = {
  access_token: { en: "Access token", zh: "访问令牌", setting: true },
  webhook_secret: { en: "Webhook secret", zh: "Webhook 密钥", setting: true },
  quarterly_product: { en: "Quarterly product setting", zh: "季度产品设置", setting: true },
  six_month_product: { en: "Six-month product setting", zh: "半年产品设置", setting: true },
  checkout_implementation: { en: "Checkout implementation", zh: "结账功能实现", setting: false },
  verified_webhooks: { en: "Verified webhook handling", zh: "Webhook 处理验证", setting: false },
  sandbox_payment_test: { en: "Sandbox payment test", zh: "沙盒支付测试", setting: false },
};

export default function BillingReadiness() {
  const { language } = useLocale();
  const isEnglish = language === "en";
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<BillingReadinessResponse>({
    queryKey: ["/api/admin/billing/readiness"],
    retry: false,
  });

  return (
    <section aria-labelledby="billing-readiness-title" data-testid="billing-readiness">
      <Card className="border-primary/25 bg-primary/[0.025]">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {isEnglish ? "Administrator · Polar.sh" : "管理员 · Polar.sh"}
              </p>
              <CardTitle id="billing-readiness-title" className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {isEnglish ? "Billing readiness" : "账单接入准备情况"}
              </CardTitle>
              <CardDescription>
                {isEnglish
                  ? "A private checklist of setup presence and work still required."
                  : "仅供管理员查看的配置存在情况与待完成事项。"}
              </CardDescription>
            </div>
            <span className="rounded-full border border-amber-600/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
              {isEnglish ? "Not connected" : "尚未连接"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-600/20 bg-amber-500/[0.07] px-4 py-3 text-sm">
            <p className="font-semibold">
              {isEnglish ? "Checkout is disabled. No charges are collected." : "结账功能已禁用，不会收取任何费用。"}
            </p>
            <p className="mt-1 text-muted-foreground">
              {isEnglish
                ? "Settings marked present only indicate that a value exists; they do not confirm that credentials are valid or that Polar.sh is connected."
                : "标记为“已设置”仅表示存在配置值，不代表凭据有效或已连接 Polar.sh。"}
            </p>
          </div>

          {isLoading && (
            <div
              className="space-y-3 rounded-lg border p-4"
              aria-label={isEnglish ? "Loading billing readiness" : "正在加载账单接入状态"}
              aria-busy="true"
            >
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-64 animate-pulse rounded bg-muted" />
              <div className="h-4 w-52 animate-pulse rounded bg-muted" />
            </div>
          )}

          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {isEnglish ? "Could not load billing readiness" : "无法加载账单接入状态"}
              </AlertTitle>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  {isEnglish
                    ? "No payment settings are changed. Try again."
                    : "付款设置未发生变化，请重试。"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="button-retry-billing-readiness"
                  onClick={() => void refetch()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isEnglish ? "Retry" : "重试"}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && data && (
            <ul className="divide-y rounded-lg border">
              {data.checks.map((check) => {
                const copy = checkCopy[check.id];
                if (!copy) return null;
                const label = isEnglish ? copy.en : copy.zh;
                return (
                  <li key={check.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="flex shrink-0 items-center gap-2 text-right text-xs text-muted-foreground">
                      {copy.setting ? (
                        <>
                          <CheckCircle2
                            className={`h-4 w-4 ${check.complete ? "text-primary" : "text-muted-foreground"}`}
                            aria-hidden="true"
                          />
                          {check.complete
                            ? isEnglish ? "Present" : "已设置"
                            : isEnglish ? "Missing" : "缺少"}
                        </>
                      ) : (
                        <>
                          <CircleDashed className="h-4 w-4 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                          {isEnglish ? "Still required" : "仍需完成"}
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            {isEnglish
              ? "Credential values and product identifiers are intentionally not shown here. Checkout remains unavailable until implementation and verification are complete."
              : "此处不会显示凭据值或产品标识。完成结账实现与验证前，结账功能仍不可用。"}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
