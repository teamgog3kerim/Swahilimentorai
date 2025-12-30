import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import OpenAI from "openai";
import { z } from "zod";
import { insertUserProgressSchema, insertChatSessionSchema, insertChatMessageSchema, insertSubscriptionSchema } from "@shared/schema";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";

const countryNames: Record<string, string> = {
  'CN': 'China', 'US': 'United States', 'GB': 'United Kingdom', 'DE': 'Germany',
  'FR': 'France', 'JP': 'Japan', 'KR': 'South Korea', 'IN': 'India', 'BR': 'Brazil',
  'RU': 'Russia', 'CA': 'Canada', 'AU': 'Australia', 'MX': 'Mexico', 'ES': 'Spain',
  'IT': 'Italy', 'NL': 'Netherlands', 'SE': 'Sweden', 'CH': 'Switzerland', 'TW': 'Taiwan',
  'HK': 'Hong Kong', 'SG': 'Singapore', 'KE': 'Kenya', 'TZ': 'Tanzania', 'UG': 'Uganda',
  'RW': 'Rwanda', 'ZA': 'South Africa', 'NG': 'Nigeria', 'EG': 'Egypt', 'MA': 'Morocco',
  'TH': 'Thailand', 'VN': 'Vietnam', 'ID': 'Indonesia', 'MY': 'Malaysia', 'PH': 'Philippines',
  'PL': 'Poland', 'TR': 'Turkey', 'SA': 'Saudi Arabia', 'AE': 'UAE', 'IL': 'Israel',
  'AR': 'Argentina', 'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru', 'VE': 'Venezuela',
};

function getCountryName(code: string): string {
  return countryNames[code.toUpperCase()] || code;
}

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// The newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Validation schemas
const progressSchema = z.object({
  lessonId: z.string(),
  completed: z.boolean(),
  completedAt: z.string().optional(),
});

const chatSessionSchema = z.object({
  lessonId: z.string().optional(),
  level: z.string(),
});

const chatMessageSchema = z.object({
  sessionId: z.string(),
  content: z.string(),
});

const subscriptionCreateSchema = z.object({
  transactionId: z.string(),
  planType: z.enum(['monthly', 'quarterly']).default('monthly'),
});

const adminActionSchema = z.object({
  subscriptionId: z.string(),
  action: z.enum(['approve', 'reject']),
});

const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);


  // ==================== LESSON ROUTES ====================
  
  // GET /api/lessons - Return all lessons
  app.get('/api/lessons', isAuthenticated, async (req: any, res) => {
    try {
      const lessons = await storage.getAllLessons();
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  // GET /api/lessons/level/:level - Return lessons by level
  app.get('/api/lessons/level/:level', isAuthenticated, async (req: any, res) => {
    try {
      const { level } = req.params;
      if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
        return res.status(400).json({ message: "Invalid level. Must be beginner, intermediate, or advanced" });
      }
      const lessons = await storage.getLessonsByLevel(level);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons by level:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  // GET /api/lessons/:id - Return single lesson
  app.get('/api/lessons/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const lesson = await storage.getLesson(id);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  // ==================== PROGRESS ROUTES ====================

  // GET /api/progress - Get user's progress for all lessons
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const progress = await storage.getUserProgress(user.id);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // POST /api/progress - Upsert progress
  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validation = progressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request body", errors: validation.error.errors });
      }

      const { lessonId, completed, completedAt } = validation.data;

      const progressData = {
        userId: user.id,
        lessonId,
        completed,
        completedAt: completedAt ? new Date(completedAt) : (completed ? new Date() : undefined),
      };

      const progress = await storage.upsertUserProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // ==================== CHAT ROUTES ====================

  // POST /api/chat/session - Create new chat session
  app.post('/api/chat/session', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validation = chatSessionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request body", errors: validation.error.errors });
      }

      const { lessonId, level } = validation.data;

      const sessionData = {
        userId: user.id,
        lessonId: lessonId || null,
        level,
      };

      const session = await storage.createChatSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  // GET /api/chat/sessions - Get user's chat sessions
  app.get('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const sessions = await storage.getUserChatSessions(user.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  // GET /api/chat/session/:id - Get specific session with messages
  app.get('/api/chat/session/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { id } = req.params;
      const session = await storage.getChatSession(id);
      
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      if (session.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized to access this session" });
      }

      const messages = await storage.getChatMessages(id);
      res.json({ ...session, messages });
    } catch (error) {
      console.error("Error fetching chat session:", error);
      res.status(500).json({ message: "Failed to fetch chat session" });
    }
  });

  // POST /api/chat/message - Send message and get AI response
  app.post('/api/chat/message', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validation = chatMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request body", errors: validation.error.errors });
      }

      const { sessionId, content } = validation.data;

      // Check if premium subscription is expired (server-side validation)
      // Admins have full access without subscription
      const now = new Date();
      const isExpired = user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) < now;
      const isPremiumActive = user.isAdmin || (user.isPremium && !isExpired);

      // Check free tier limit (admins bypass this check)
      if (!isPremiumActive && user.practiceCount >= 10) {
        return res.status(403).json({ 
          message: isExpired 
            ? "Your subscription has expired. Please renew to continue practicing."
            : "Free tier limit reached. Please upgrade to premium to continue practicing.",
          requiresUpgrade: true 
        });
      }

      // Get session to check authorization and get level
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      if (session.userId !== user.id) {
        return res.status(403).json({ message: "Not authorized to access this session" });
      }

      // Get conversation history
      const previousMessages = await storage.getChatMessages(sessionId);

      // Create system prompt based on level
      const levelDescriptions = {
        beginner: "初学者 (beginner)",
        intermediate: "中级 (intermediate)",
        advanced: "高级 (advanced)"
      };

      const systemPrompt = `你是一位耐心的斯瓦希里语老师，专门为中国学习者提供帮助。学生目前处于${levelDescriptions[session.level as keyof typeof levelDescriptions] || session.level}水平。

请遵循以下规则：
1. 主要用斯瓦希里语回应，并在括号中提供中文翻译
2. 根据学生的水平调整你的语言复杂度
3. 纠正错误时要鼓励和支持
4. 提供清晰的解释和例子
5. 保持对话自然和互动
6. 如果学生用中文提问，用斯瓦希里语回答并提供中文翻译

You are a patient Swahili teacher helping Chinese learners. The student is currently at ${session.level} level.

Follow these rules:
1. Respond primarily in Swahili with Chinese translations in parentheses
2. Adjust your language complexity based on the student's level
3. Be encouraging and supportive when correcting mistakes
4. Provide clear explanations and examples
5. Keep the conversation natural and interactive
6. If the student asks in Chinese, respond in Swahili with Chinese translations`;

      // Build messages array for OpenAI
      const messages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      // Add conversation history
      for (const msg of previousMessages) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }

      // Add current user message
      messages.push({
        role: "user",
        content: content
      });

      // Call OpenAI API
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: messages,
        max_completion_tokens: 8192,
      });

      const aiResponse = completion.choices[0]?.message?.content || "抱歉，我现在无法回应。(Sorry, I cannot respond right now.)";

      // Save user message
      await storage.createChatMessage({
        sessionId,
        role: "user",
        content: content,
      });

      // Save AI response
      await storage.createChatMessage({
        sessionId,
        role: "assistant",
        content: aiResponse,
      });

      // Increment practice count for non-premium users (including expired subscriptions)
      if (!isPremiumActive) {
        await storage.incrementPracticeCount(user.id);
      }

      res.json({
        message: aiResponse,
        practiceCount: isPremiumActive ? null : user.practiceCount + 1,
        isPremium: isPremiumActive
      });
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // ==================== SUBSCRIPTION ROUTES ====================

  // GET /api/subscription - Get user's active subscription
  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const subscription = await storage.getUserActiveSubscription(user.id);
      res.json(subscription || null);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // POST /api/subscription/verify-payment - Submit payment for verification
  app.post('/api/subscription/verify-payment', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has an active subscription
      const existingSubscription = await storage.getUserActiveSubscription(user.id);
      if (existingSubscription && existingSubscription.status === "active") {
        // Allow renewal if subscription expires within 4 days
        const daysUntilExpiration = Math.floor((new Date(existingSubscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiration > 4) {
          return res.status(400).json({ 
            message: "You already have an active subscription. You can renew starting 4 days before expiration.",
            subscription: existingSubscription,
            daysUntilExpiration
          });
        }
      }

      const validation = subscriptionCreateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request body", errors: validation.error.errors });
      }

      const { transactionId, planType } = validation.data;

      // Validate transaction ID format (basic validation for TRC20)
      // TRC20 transaction IDs are typically 64-character hexadecimal strings
      if (!transactionId || transactionId.trim().length < 10) {
        return res.status(400).json({ message: "Transaction ID must be at least 10 characters" });
      }

      // Check for duplicate transaction ID submissions
      const existingTxSubscription = await storage.getSubscriptionByTransactionId(transactionId);
      if (existingTxSubscription) {
        return res.status(400).json({ 
          message: "This transaction ID has already been submitted",
          duplicate: true 
        });
      }

      // Determine pricing and duration based on plan type
      const planConfig = {
        monthly: { amount: 90, days: 30 },
        quarterly: { amount: 250, days: 90 }
      };
      const { amount, days } = planConfig[planType];

      // Calculate dates (for when subscription is approved)
      // For renewals, extend from current end date; for new subscriptions, start from now
      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      
      if (existingSubscription && existingSubscription.endDate) {
        // Renewal: extend from current end date (or now if already expired)
        const currentEndDate = new Date(existingSubscription.endDate);
        startDate = currentEndDate > now ? currentEndDate : now;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days); // Add days based on plan type
      } else {
        // New subscription: start from now
        startDate = now;
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + days); // days from now based on plan type
      }

      // Create PENDING subscription - requires manual admin verification
      // Admin must verify the transaction on Binance before activating
      const subscriptionData = {
        userId: user.id,
        status: "pending", // Pending verification - admin must approve
        planType,
        amount,
        currency: "USDT",
        paymentMethod: "Binance Pay (TRC20)",
        startDate,
        endDate,
        transactionId,
      };

      const subscription = await storage.createSubscription(subscriptionData);

      await storage.createNotification({
        type: 'new_subscription',
        title: '新订阅申请',
        message: `${user.username} (${user.email}) 提交了${planType === 'monthly' ? '月度' : '季度'}订阅申请，交易ID: ${transactionId}`,
        metadata: { 
          userId: user.id, 
          email: user.email, 
          subscriptionId: subscription.id,
          planType,
          amount,
          transactionId 
        },
      });

      // DO NOT update user premium status - this happens after admin verification
      // await storage.updateUserPremiumStatus(user.id, true, endDate);

      res.json({ 
        ...subscription, 
        message: "Payment submitted for verification. We'll activate your subscription within 1-2 hours after confirming the transaction." 
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // POST /api/subscription/create - Create subscription (deprecated - use verify-payment)
  app.post('/api/subscription/create', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validation = subscriptionCreateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request body", errors: validation.error.errors });
      }

      const { transactionId } = validation.data;

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days from now

      // Create subscription
      const subscriptionData = {
        userId: user.id,
        status: "active",
        amount: 90,
        currency: "USDT",
        paymentMethod: "Binance Pay",
        startDate,
        endDate,
        transactionId,
      };

      const subscription = await storage.createSubscription(subscriptionData);

      await storage.createNotification({
        type: 'new_subscription',
        title: '新订阅激活',
        message: `${user.username} (${user.email}) 订阅已激活，交易ID: ${transactionId}`,
        metadata: { 
          userId: user.id, 
          email: user.email, 
          subscriptionId: subscription.id,
          transactionId 
        },
      });

      // Update user premium status
      await storage.updateUserPremiumStatus(user.id, true, endDate);

      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // ==================== ADMIN ROUTES ====================

  // GET /api/admin/users - Get all users (admin only)
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // GET /api/admin/subscriptions - Get all subscriptions (admin only)
  app.get('/api/admin/subscriptions', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // GET /api/admin/pending - Get pending subscriptions (admin only)
  app.get('/api/admin/pending', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const pending = await storage.getPendingSubscriptions();
      res.json(pending);
    } catch (error) {
      console.error("Error fetching pending subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch pending subscriptions" });
    }
  });

  // POST /api/admin/subscription/action - Approve or reject subscription (admin only)
  app.post('/api/admin/subscription/action', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validation = adminActionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request body", errors: validation.error.errors });
      }

      const { subscriptionId, action } = validation.data;

      const subscription = await storage.getSubscription(subscriptionId);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      if (subscription.status !== 'pending') {
        return res.status(400).json({ message: `Subscription is already ${subscription.status}` });
      }

      if (action === 'approve') {
        await storage.updateSubscriptionStatus(subscriptionId, 'active');
        await storage.updateUserPremiumStatus(subscription.userId, true, subscription.endDate);
        res.json({ 
          success: true, 
          message: "Subscription approved and user premium status activated",
          subscriptionId,
          endDate: subscription.endDate
        });
      } else {
        await storage.updateSubscriptionStatus(subscriptionId, 'rejected');
        res.json({ 
          success: true, 
          message: "Subscription rejected",
          subscriptionId
        });
      }
    } catch (error) {
      console.error("Error processing subscription action:", error);
      res.status(500).json({ message: "Failed to process subscription action" });
    }
  });

  // GET /api/admin/check - Check if current user is admin
  app.get('/api/admin/check', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ isAdmin: user.isAdmin });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });

  // ==================== ANALYTICS ROUTES ====================

  const visitRateLimitBySession = new Map<string, number>();
  const visitRateLimitByIp = new Map<string, { count: number; firstRequest: number }>();
  
  // POST /api/analytics/visit - Track page visit
  app.post('/api/analytics/visit', async (req: any, res) => {
    try {
      if (!req.sessionID) {
        return res.status(403).json({ message: "Session required" });
      }
      
      const sessionId = req.sessionID;
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
      
      const now = Date.now();
      
      const ipData = visitRateLimitByIp.get(ipHash);
      if (ipData) {
        const windowMs = 60000;
        if (now - ipData.firstRequest < windowMs) {
          if (ipData.count >= 10) {
            return res.status(429).json({ message: "Too many requests" });
          }
          ipData.count++;
        } else {
          visitRateLimitByIp.set(ipHash, { count: 1, firstRequest: now });
        }
      } else {
        visitRateLimitByIp.set(ipHash, { count: 1, firstRequest: now });
      }
      
      const lastVisit = visitRateLimitBySession.get(sessionId) || 0;
      if (now - lastVisit < 60000) {
        return res.json({ success: true, cached: true });
      }
      visitRateLimitBySession.set(sessionId, now);
      
      if (visitRateLimitBySession.size > 10000) {
        const entries = Array.from(visitRateLimitBySession.entries());
        entries.slice(0, 5000).forEach(([key]) => visitRateLimitBySession.delete(key));
      }
      if (visitRateLimitByIp.size > 10000) {
        const entries = Array.from(visitRateLimitByIp.entries());
        entries.slice(0, 5000).forEach(([key]) => visitRateLimitByIp.delete(key));
      }
      
      const userAgent = req.headers['user-agent'] || '';
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      
      const userId = req.user?.id || null;
      
      let countryCode = 'Unknown';
      let countryName = 'Unknown';
      
      const cfCountry = req.headers['cf-ipcountry'];
      if (cfCountry) {
        countryCode = cfCountry as string;
        countryName = getCountryName(countryCode);
      }
      
      const deviceType = result.device.type || 'desktop';
      
      await storage.createVisit({
        sessionId,
        userId,
        countryCode,
        countryName,
        browserName: result.browser.name || 'Unknown',
        browserVersion: result.browser.version || '',
        osName: result.os.name || 'Unknown',
        deviceType,
        deviceVendor: result.device.vendor || '',
        ipHash,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking visit:", error);
      res.status(500).json({ message: "Failed to track visit" });
    }
  });

  // GET /api/admin/analytics/overview - Get analytics overview (admin only)
  app.get('/api/admin/analytics/overview', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const overview = await storage.getAnalyticsOverview();
      res.json(overview);
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  // GET /api/admin/analytics/countries - Get top countries (admin only)
  app.get('/api/admin/analytics/countries', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const countries = await storage.getTopCountries(limit);
      res.json(countries);
    } catch (error) {
      console.error("Error fetching country analytics:", error);
      res.status(500).json({ message: "Failed to fetch country analytics" });
    }
  });

  // GET /api/admin/analytics/browsers - Get top browsers (admin only)
  app.get('/api/admin/analytics/browsers', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const browsers = await storage.getTopBrowsers(limit);
      res.json(browsers);
    } catch (error) {
      console.error("Error fetching browser analytics:", error);
      res.status(500).json({ message: "Failed to fetch browser analytics" });
    }
  });

  // GET /api/admin/analytics/devices - Get top devices (admin only)
  app.get('/api/admin/analytics/devices', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const devices = await storage.getTopDevices(limit);
      res.json(devices);
    } catch (error) {
      console.error("Error fetching device analytics:", error);
      res.status(500).json({ message: "Failed to fetch device analytics" });
    }
  });

  // GET /api/admin/analytics/visits-by-date - Get visits over time (admin only)
  app.get('/api/admin/analytics/visits-by-date', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const visitsByDate = await storage.getVisitsByDate(days);
      res.json(visitsByDate);
    } catch (error) {
      console.error("Error fetching visits by date:", error);
      res.status(500).json({ message: "Failed to fetch visits by date" });
    }
  });

  // ==================== ADMIN NOTIFICATIONS ROUTES ====================

  // GET /api/admin/notifications - Get all notifications (admin only)
  app.get('/api/admin/notifications', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await storage.getAllNotifications(limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // GET /api/admin/notifications/unread-count - Get unread count (admin only)
  app.get('/api/admin/notifications/unread-count', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const count = await storage.getUnreadNotificationCount();
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // POST /api/admin/notifications/:id/read - Mark notification as read (admin only)
  app.post('/api/admin/notifications/:id/read', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // POST /api/admin/notifications/read-all - Mark all notifications as read (admin only)
  app.post('/api/admin/notifications/read-all', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.markAllNotificationsAsRead();
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // DELETE /api/admin/notifications/:id - Delete notification (admin only)
  app.delete('/api/admin/notifications/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

export { isAuthenticated };
