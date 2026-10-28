export function polarRedirectUrl(value: unknown, environment: string): string | null {
  if (typeof value !== "string") return null;
  const hosts = environment === "live" ? ["polar.sh", "buy.polar.sh"]
    : environment === "sandbox" ? ["sandbox.polar.sh", "sandbox-buy.polar.sh"] : [];
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
      !hosts.includes(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}
