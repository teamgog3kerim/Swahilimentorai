// Navigation only: this never authorizes a purchase or grants course access.
// Local storage preserves the destination when Google opens a separate tab.
const KEY = "afri-panda-subscription-intent";

export function rememberSubscriptionIntent() {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // The sign-in page remains usable when browser storage is unavailable.
  }
}

export function hasSubscriptionIntent() {
  try {
    const timestamp = Number(localStorage.getItem(KEY));
    return timestamp > 0 && Date.now() - timestamp < 15 * 60_000;
  } catch {
    return false;
  }
}

export function clearSubscriptionIntent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Navigation hints are optional; authentication does not depend on them.
  }
}
