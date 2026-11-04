import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { signupSchema, loginSchema } from "@shared/schema";
import { registerGoogleAuth } from "./googleAuth";
import { isOwnerEmail, normalizedEmail } from "./accountPolicy";
import { createCanonicalDomainRedirect } from "./canonicalDomain";

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
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(createCanonicalDomainRedirect());
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  registerGoogleAuth(app);

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          if (isOwnerEmail(email)) {
            return done(null, false, { message: "请使用 Google 登录管理员账户" });
          }
          const user = await storage.getUserByEmail(normalizedEmail(email));
          if (!user) {
            return done(null, false, { message: "用户不存在" });
          }
          if (!user.passwordHash) {
            return done(null, false, { message: "账户密码未设置" });
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
      if (isOwnerEmail(email)) {
        return res.status(400).json({ message: "请使用 Google 登录管理员账户" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "该邮箱已被注册" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUserWithPassword(normalizedEmail(email), name, passwordHash);

      await storage.createNotification({
        type: 'new_user',
        title: '新用户注册',
        message: `${name} (${email}) 刚刚注册了账户`,
        metadata: { userId: user.id, email: user.email, username: name },
      });

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

    const rememberMe = req.body.rememberMe === true;

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
        
        if (rememberMe && req.session) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        }
        
        res.json({ 
          message: "登录成功", 
          user: { id: user.id, email: user.email, username: user.username } 
        });
      });
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
      // A session-status probe is not a protected resource. All protected
      // routes still use isAuthenticated and return 401 when signed out.
      return res.json(null);
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
      googleConnected: Boolean(user.googleId),
      authProvider: user.authProvider,
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "未登录" });
  }
  next();
};
