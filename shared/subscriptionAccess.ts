export const FREE_TRIAL_HOURS = 88;
export const FREE_TRIAL_MS = FREE_TRIAL_HOURS * 60 * 60 * 1000;

export function createTrialEndDate(now = Date.now()): Date {
  return new Date(now + FREE_TRIAL_MS);
}

export interface LearningAccessUser {
  isAdmin: boolean;
  isPremium: boolean;
  subscriptionEndsAt: Date | string | null;
}

/** The stored deadline is authoritative, including previously granted access. */
export function hasLearningAccess(user: LearningAccessUser | null | undefined, now = Date.now()): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (!user.isPremium) return false;
  if (user.subscriptionEndsAt === null) return true;
  return new Date(user.subscriptionEndsAt).getTime() > now;
}
