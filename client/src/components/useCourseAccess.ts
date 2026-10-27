import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { hasLearningAccess } from "@shared/subscriptionAccess";

type AccessUser = Pick<User, "isAdmin" | "isPremium" | "subscriptionEndsAt"> | null;

export function useCourseAccess(user: AccessUser): boolean {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const refresh = () => {
      setNow(Date.now());
      void queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [queryClient]);

  useEffect(() => {
    const rawEnd = user?.subscriptionEndsAt;
    if (!rawEnd) return;
    const end = rawEnd instanceof Date ? rawEnd.getTime() : new Date(rawEnd).getTime();
    if (!Number.isFinite(end)) return;

    // Browser timeouts overflow beyond ~24.8 days; the interval handles longer grants.
    const remaining = end - Date.now();
    if (remaining > 2_147_483_646) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, remaining) + 1);
    return () => window.clearTimeout(timer);
  }, [user?.subscriptionEndsAt]);

  return hasLearningAccess(user, now);
}
