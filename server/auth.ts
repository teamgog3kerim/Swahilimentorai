import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { signupSchema, loginSchema } from "@shared/schema";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "用户不存在" });
          }
          if (!user.passwordHash) {
            return done(null, false, { message: "请使用Google登录" });
          }
          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "密码错误" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const callbackURL = process.env.NODE_ENV === "production"
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/auth/google/callback`
      : "http://localhost:5000/api/auth/google/callback";

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(null, false, { message: "无法获取Google邮箱" });
            }

            let user = await storage.getUserByGoogleId(profile.id);
            if (user) {
              return done(null, user);
            }

            user = await storage.getUserByEmail(email);
            if (user) {
              if (!user.googleId) {
                await storage.updateUserGoogleId(user.id, profile.id, profile.photos?.[0]?.value);
              }
              return done(null, user);
            }

            user = await storage.createUserWithGoogle(
              email,
              profile.displayName || email.split("@")[0],
              profile.id,
              profile.photos?.[0]?.value
            );
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validation = signupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "验证失败", 
          errors: validation.error.errors 
        });
      }

      const { email, password, name } = validation.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "该邮箱已被注册" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUserWithPassword(email, name, passwordHash);

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "登录失败" });
        }
        res.json({ 
          message: "注册成功", 
          user: { id: user.id, email: user.email, username: user.username } 
        });
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "注册失败" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "验证失败", 
        errors: validation.error.errors 
      });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "登录失败" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "登录失败" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "登录失败" });
        }
        res.json({ 
          message: "登录成功", 
          user: { id: user.id, email: user.email, username: user.username } 
        });
      });
    })(req, res, next);
  });

  app.get("/api/auth/google", (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ message: "Google登录暂不可用" });
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", {
      successRedirect: "/dashboard",
      failureRedirect: "/login?error=google_failed",
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "登出失败" });
      }
      req.session.destroy((err) => {
        res.json({ message: "登出成功" });
      });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "未登录" });
    }
    const user = req.user as any;
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      isPremium: user.isPremium,
      isAdmin: user.isAdmin,
      subscriptionEndsAt: user.subscriptionEndsAt,
      practiceCount: user.practiceCount,
      profileImageUrl: user.profileImageUrl,
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "未登录" });
  }
  next();
};
