import { useEffect, useState } from "react";
import { AlertCircle, Clock, Crown, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Subscription, User } from "@shared/schema";
import { useLocale } from "@/lib/i18n";

interface SubscriptionReminderProps {
  user: User;
  onUpgrade: () => void;
}

export function SubscriptionReminder({ user, onUpgrade }: SubscriptionReminderProps) {
  const { language } = useLocale();
  const english = language === "en";
  const [dismissed, setDismissed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["/api/subscription"],
    enabled: !user.isAdmin,
    retry: false,
  });

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!user.subscriptionEndsAt) return;
    const remaining = new Date(user.subscriptionEndsAt).getTime() - Date.now();
    if (!Number.isFinite(remaining) || remaining > 2_147_483_646) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, remaining) + 1);
    return () => window.clearTimeout(timer);
  }, [user.subscriptionEndsAt]);

  if (user.isAdmin) return null;

  const endDate = user.subscriptionEndsAt
    ? user.subscriptionEndsAt instanceof Date
      ? user.subscriptionEndsAt
      : new Date(user.subscriptionEndsAt)
    : null;
  if (!endDate || !Number.isFinite(endDate.getTime())) return null;

  // A null-ended premium account is a lifetime entitlement, not an expiring trial.
  if (user.isPremium && user.subscriptionEndsAt == null) return null;

  const remainingMs = endDate.getTime() - now;
  const expired = remainingMs <= 0;
  const remainingHours = Math.max(0, Math.ceil(remainingMs / 3_600_000));
  const hasPaidRecord = Boolean(subscription);
  const isPaid = hasPaidRecord;
  const isInReminderWindow = !isPaid || remainingMs <= 72 * 3_600_000;
  if (!expired && !isInReminderWindow) return null;
  if (dismissed && !expired) return null;

  const title = expired
    ? isPaid
      ? english ? "Subscription expired" : "订阅已到期"
      : english ? "Trial expired" : "试用已结束"
    : isPaid
      ? english ? "Subscription ending soon" : "订阅即将到期"
      : english ? "Trial ending soon" : "试用即将结束";
  const description = expired
    ? isPaid
      ? english
        ? "Your access period has ended. Subscribe again to continue your courses and practice."
        : "你的订阅期限已结束。重新订阅即可继续课程和练习。"
      : english
        ? "Your 88-hour trial has ended. Subscribe to continue courses and practice. No automatic charge was made."
        : "你的 88 小时试用已结束。订阅后可继续课程和练习；试用结束不会自动扣费。"
    : isPaid
      ? english
        ? `Your subscription ends in ${remainingHours} hour${remainingHours === 1 ? "" : "s"}.`
        : `你的订阅将在 ${remainingHours} 小时后到期。`
      : english
        ? `Your 88-hour trial ends in ${remainingHours} hour${remainingHours === 1 ? "" : "s"}.`
        : `你的 88 小时试用将在 ${remainingHours} 小时后结束。`;
  const Icon = expired ? AlertCircle : isPaid ? Crown : Clock;

  return (
    <Alert
      variant={expired ? "destructive" : "default"}
      className="relative mb-4"
      data-testid="alert-subscription-reminder"
    >
      <Icon className="h-4 w-4" />
      <AlertTitle data-testid="text-reminder-title">{title}</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="flex-1" data-testid="text-reminder-description">{description}</span>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onUpgrade} data-testid="button-upgrade-reminder">
            {english ? (isPaid ? "Renew subscription" : "View subscriptions") : (isPaid ? "续订" : "查看订阅")}
          </Button>
          {!expired && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDismissed(true)}
              aria-label={english ? "Dismiss reminder" : "关闭提醒"}
              className="h-7 w-7"
              data-testid="button-dismiss-reminder"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
