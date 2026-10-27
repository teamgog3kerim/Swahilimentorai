import type { Express } from "express";
import * as oidc from "openid-client";
import { storage } from "./storage";
import { verifiedGoogleProfile } from "./accountPolicy";

declare module "express-session" {
  interface SessionData {
    googleOAuth?: { state: string; verifier: string; nonce: string; startedAt: number };
  }
}

export function googleAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL?.startsWith("https://"));
}

let configuration: Promise<oidc.Configuration> | undefined;
function getConfiguration() {
  if (!configuration) {
    configuration = oidc.discovery(
      new URL("https://accounts.google.com"),
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
    ).catch((error) => { configuration = undefined; throw error; });
  }
  return configuration;
}

export function registerGoogleAuth(app: Express) {
  app.get("/api/auth/providers", (_req, res) => {
    res.json({ google: googleAuthConfigured() });
  });

  app.get("/api/auth/google", async (req, res) => {
    if (!googleAuthConfigured()) {
      return res.status(503).json({ message: "Google sign-in is not configured." });
    }
    try {
      const config = await getConfiguration();
      const verifier = oidc.randomPKCECodeVerifier();
      const state = oidc.randomState();
      const nonce = oidc.randomNonce();
      req.session.googleOAuth = { state, verifier, nonce, startedAt: Date.now() };
      const authorizationUrl = oidc.buildAuthorizationUrl(config, {
        redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
        scope: "openid email profile",
        response_type: "code",
        state,
        nonce,
        code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
        code_challenge_method: "S256",
        prompt: "select_account",
      });
      req.session.save((error) => {
        if (error) return res.redirect("/login?google_error=failed");
        res.redirect(authorizationUrl.href);
      });
    } catch {
      // Never log token exchanges or OAuth credentials.
      res.redirect("/login?google_error=failed");
    }
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const pending = req.session.googleOAuth;
    delete req.session.googleOAuth;
    if (!googleAuthConfigured() || !pending || Date.now() - pending.startedAt > 600_000) {
      return res.redirect("/login?google_error=expired");
    }
    try {
      const config = await getConfiguration();
      const callbackUrl = new URL(process.env.GOOGLE_CALLBACK_URL!);
      callbackUrl.search = new URL(req.originalUrl, callbackUrl).search;
      const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: pending.verifier,
        expectedState: pending.state,
        expectedNonce: pending.nonce,
        idTokenExpected: true,
      });
      const profile = verifiedGoogleProfile(tokens.claims() as Record<string, unknown>);
      const currentUserId = req.isAuthenticated() ? (req.user as { id: string }).id : undefined;
      const user = await storage.signInWithGoogle(profile, currentUserId);
      req.login(user, (error) => {
        if (error) return res.redirect("/login?google_error=failed");
        req.session.save((saveError) => {
          res.redirect(saveError ? "/login?google_error=failed" : "/dashboard");
        });
      });
    } catch (error) {
      const code = error instanceof Error && error.message === "link_required" ? "link_required"
        : error instanceof Error && error.message === "email_mismatch" ? "email_mismatch"
        : error instanceof Error && error.message === "verified_gmail_required" ? "gmail_required" : "failed";
      res.redirect(`/login?google_error=${code}`);
    }
  });
}
