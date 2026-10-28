type Environment = Record<string, string | undefined>;

// Preview is always sandbox. Production never falls back to sandbox credentials.
export function polarConfig(env: Environment = process.env) {
  const environment = env.NODE_ENV === "production" ? "live"
    : env.NODE_ENV === "development" ? "sandbox" : "disabled";
  let appOrigin: string | undefined;
  try {
    const url = new URL(environment === "live" ? env.POLAR_APP_URL || ""
      : environment === "sandbox" && env.REPLIT_DEV_DOMAIN ? `https://${env.REPLIT_DEV_DOMAIN}` : "");
    if (url.protocol === "https:" && !url.username && !url.password && !url.port &&
      url.pathname === "/" && !url.search && !url.hash &&
      (environment !== "live" || !url.hostname.endsWith(".replit.dev"))) appOrigin = url.origin;
  } catch { /* Missing or invalid trusted configuration disables checkout. */ }
  return {
    environment,
    api: environment === "live" ? "https://api.polar.sh" : "https://sandbox-api.polar.sh",
    accessToken: environment === "live" ? env.POLAR_LIVE_ACCESS_TOKEN
      : environment === "sandbox" ? env.POLAR_ACCESS_TOKEN : undefined,
    webhookSecret: environment === "live" ? env.POLAR_LIVE_WEBHOOK_SECRET
      : environment === "sandbox" ? env.POLAR_WEBHOOK_SECRET : undefined,
    appOrigin,
    checkoutAllowed: environment === "sandbox" ||
      (environment === "live" && env.POLAR_LIVE_ENABLED === "true"),
  };
}
