import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";

export function GoogleSignInButton({ connect = false }: { connect?: boolean }) {
  const { language } = useLocale();
  const en = language === "en";
  const { data, isLoading, isError } = useQuery<{ google: boolean }>({
    queryKey: ["/api/auth/providers"],
    retry: false,
    staleTime: 60_000,
  });
  const code = new URLSearchParams(window.location.search).get("google_error");
  const errors: Record<string, [string, string]> = {
    link_required: ["该邮箱已有账户。请先使用密码登录，然后在账户菜单关联 Google。", "An account already uses this email. Sign in with your password, then connect Google from your account menu."],
    email_mismatch: ["请选择与当前账户邮箱相同的 Google 账户。", "Choose the Google account with the same email as your current account."],
    gmail_required: ["请使用已验证的 Gmail 账户。", "Please use a verified Gmail account."],
    expired: ["登录请求已过期，请重试。", "This sign-in request expired. Please try again."],
    failed: ["Google 登录未完成，请重试。", "Google sign-in was not completed. Please try again."],
  };
  return (
    <div className="space-y-2">
      {code && <p role="alert" className="text-sm text-destructive">{(errors[code] ?? errors.failed)[en ? 1 : 0]}</p>}
      <Button
        type="button" variant="outline" className="w-full gap-2"
        disabled={isLoading || !data?.google}
        onClick={() => window.location.assign("/api/auth/google")}
        data-testid="button-google-signin"
      >
        <span aria-hidden="true" className="font-bold text-blue-600">G</span>
        {connect ? (en ? "Connect Google account" : "关联 Google 账户") : (en ? "Continue with Google" : "使用 Google 继续")}
      </Button>
      {!data?.google && !isLoading && <p className="text-xs text-muted-foreground">
        {isError
          ? (en ? "Unable to check Google sign-in availability." : "无法检查 Google 登录状态。")
          : (en ? "Google sign-in is awaiting administrator setup. Email and password are still available." : "Google 登录待管理员配置。您仍可使用邮箱和密码。")}
      </p>}
      {!connect && <p className="text-xs text-center text-muted-foreground">{en ? "Or use email and password" : "或使用邮箱和密码"}</p>}
    </div>
  );
}
