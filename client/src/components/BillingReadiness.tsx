import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, CircleDashed, RefreshCw, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";

type BillingReadinessResponse = {
  provider: string;
  plans: Array<{ id: string }>;
  checkoutEnabled: boolean;
  environment: string;
  configured: boolean;
  webhookConfigured: boolean;
  validated: boolean;
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
    queryKey: ["/api/subscription/plans"],
    retry: false,
  });
  const validate = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/billing/validate", { method: "POST", credentials: "include" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.code || "POLAR_UNAVAILABLE");
      return result;
    },
    onSuccess: () => { void refetch(); },
  });
  const checks = data ? [
    { id: "environment", label: data.environment === "live"
      ? isEnglish ? "Live environment" : "正式环境"
      : isEnglish ? "Sandbox environment" : "沙盒环境",
      complete: data.environment === "sandbox" || data.environment === "live" },
    { id: "configuration", label: isEnglish ? "Checkout configuration complete" : "结账配置完整", complete: data.configured },
    { id: "webhook", label: isEnglish ? "Webhook secret configured" : "Webhook 密钥已配置", complete: data.webhookConfigured },
    { id: "validation", label: isEnglish ? "Configuration validated" : "配置已验证", complete: data.validated },
    { id: "checkout", label: isEnglish ? "Checkout enabled" : "结账已启用", complete: data.checkoutEnabled },
  ] : [];

  return (
    <section aria-labelledby="billing-readiness-title" data-testid="billing-readiness">
      <Card className="border-primary/25 bg-primary/[0.025]">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {isEnglish ? "Administrator · Polar billing" : "管理员 · Polar 支付"}
              </p>
              <CardTitle id="billing-readiness-title" className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {isEnglish ? "Billing readiness" : "账单接入准备情况"}
              </CardTitle>
              <CardDescription>
                {isEnglish
                  ? "Live operational flags only. Credentials and product identifiers are never displayed."
                  : "仅显示当前运行状态，不会显示凭据或产品标识。"}
              </CardDescription>
            </div>
            <span className="rounded-full border border-amber-600/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
              {data?.checkoutEnabled
                ? isEnglish ? "Checkout ready" : "结账已就绪"
                : isEnglish ? "Checkout unavailable" : "结账未就绪"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button variant="outline" disabled={validate.isPending} onClick={() => validate.mutate()}
              data-testid="button-validate-polar">
              {validate.isPending
                ? isEnglish ? "Checking connection…" : "正在检查连接…"
                : isEnglish ? "Check Polar connection" : "检查 Polar 连接"}
            </Button>
            {validate.isError && <p role="alert" className="text-sm text-destructive">
              {validate.error.message === "POLAR_TOKEN_REJECTED"
                ? isEnglish
                  ? "Polar rejected the token or its permissions. Check that it belongs to the correct organization and environment."
                  : "Polar 拒绝了令牌或其权限。请确认令牌属于正确的组织和环境。"
                : isEnglish
                  ? "Could not verify the products. Check the configuration and try again."
                  : "无法验证产品。请检查配置后重试。"}
            </p>}
            {validate.isSuccess && <p role="status" className="text-sm text-primary">
              {isEnglish ? "Both Polar products were verified." : "两个 Polar 产品均已验证。"}
            </p>}
          </div>
          <div className="rounded-lg border border-amber-600/20 bg-amber-500/[0.07] px-4 py-3 text-sm">
            <p className="font-semibold">
              {data?.environment === "live"
                ? isEnglish ? "Live mode: successful checkouts can charge real money." : "正式环境：成功结账会产生真实扣款。"
                : isEnglish ? "Sandbox only: no real charges." : "仅限沙盒环境：不会产生真实扣款。"}
            </p>
            <p className="mt-1 text-muted-foreground">
              {isEnglish
                ? "This view reports server-provided readiness flags and does not expose secret values or product IDs."
                : "此页面显示服务器提供的就绪状态，不会暴露密钥内容或产品标识。"}
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
              {checks.map((check) => {
                return (
                  <li key={check.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-sm font-medium">{check.label}</span>
                    <span className="flex shrink-0 items-center gap-2 text-right text-xs text-muted-foreground">
                      {check.complete
                        ? <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                        : <CircleDashed className="h-4 w-4 text-amber-700 dark:text-amber-300" aria-hidden="true" />}
                      {check.complete ? isEnglish ? "Ready" : "就绪" : isEnglish ? "Not ready" : "未就绪"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            {isEnglish
              ? "Checkout availability follows the server's environment, configuration, product, and webhook requirements. Product IDs and secret values are not returned."
              : "结账是否可用由服务器的运行环境、配置、产品及 webhook 条件决定。接口不会返回产品标识或密钥内容。"}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
