import type { RequestHandler } from "express";

function canonicalAppOrigin(env: NodeJS.ProcessEnv): URL | undefined {
  try {
    const callback = new URL(env.GOOGLE_CALLBACK_URL || "");
    if (
      callback.protocol !== "https:" ||
      callback.username ||
      callback.password ||
      callback.pathname !== "/api/auth/google/callback" ||
      callback.search ||
      callback.hash ||
      callback.hostname.endsWith(".replit.app")
    ) return undefined;
    return new URL(callback.origin);
  } catch {
    return undefined;
  }
}

export function createCanonicalDomainRedirect(
  env: NodeJS.ProcessEnv = process.env,
): RequestHandler {
  return (req, res, next) => {
    if (env.NODE_ENV !== "production" || !req.hostname.toLowerCase().endsWith(".replit.app")) {
      return next();
    }

    const canonicalOrigin = canonicalAppOrigin(env);
    if (!canonicalOrigin || req.hostname.toLowerCase() === canonicalOrigin.hostname.toLowerCase()) {
      return next();
    }

    const acceptsHtml = /(?:^|,)\s*text\/html(?:\s*;[^,]*)?(?:,|$)/i.test(req.get("accept") || "");
    if (
      !["GET", "HEAD"].includes(req.method) ||
      !acceptsHtml ||
      !req.originalUrl.startsWith("/") ||
      req.originalUrl.startsWith("//") ||
      req.originalUrl.includes("\\")
    ) return next();

    res.set("Cache-Control", "no-store");
    return res.redirect(302, `${canonicalOrigin.origin}${req.originalUrl}`);
  };
}
