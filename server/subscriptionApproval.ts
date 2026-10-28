import type { LearningAccessUser } from "../shared/subscriptionAccess";

const LEGACY_PLAN_DAYS: Record<string, number> = { monthly: 30, quarterly: 90 };
const DAY_MS = 24 * 60 * 60 * 1000;

/** Legacy manual payments use fixed-day terms, not the new USD calendar-month catalog. */
export function subscriptionDatesAtApproval(
  planType: string,
  user: LearningAccessUser,
  activePaidEnd: Date | null,
  approvedAt: Date,
) {
  const days = Object.hasOwn(LEGACY_PLAN_DAYS, planType) ? LEGACY_PLAN_DAYS[planType] : undefined;
  if (!days) throw new Error(`Unsupported legacy subscription plan: ${planType}`);

  const entitlementEnd = user.isPremium && user.subscriptionEndsAt !== null
    ? new Date(user.subscriptionEndsAt).getTime() : 0;
  const startDate = new Date(Math.max(
    approvedAt.getTime(),
    Number.isFinite(entitlementEnd) ? entitlementEnd : 0,
    activePaidEnd?.getTime() ?? 0,
  ));
  const endDate = new Date(startDate.getTime() + days * DAY_MS);
  return {
    startDate,
    endDate,
    // Do not replace an unlimited administrative grant with a finite subscription.
    subscriptionEndsAt: user.isPremium && user.subscriptionEndsAt === null ? null : endDate,
  };
}
