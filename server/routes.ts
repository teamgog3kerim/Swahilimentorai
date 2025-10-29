import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import OpenAI from "openai";
import { z } from "zod";
import { insertUserProgressSchema, insertChatSessionSchema, insertChatMessageSchema, insertSubscriptionSchema } from "@shared/schema";

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
});

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth route
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const replitUserId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(replitUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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
      const replitUserId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(replitUserId);
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
      const replitUserId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(replitUserId);
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
      const replitUserId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(replitUserId);
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
      const replitUserId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(replitUserId);
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
      const replitUserId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(replitUserId);
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
      const replitUserId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(replitUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validation = chatMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid request body", errors: validation.error.errors });
      }

      const { sessionId, content } = validation.data;

      // Check free tier limit
      if (!user.isPremium && user.practiceCount >= 10) {
        return res.status(403).json({ 
          message: "Free tier limit reached. Please upgrade to premium to continue practicing.",
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

      // Increment practice count for non-premium users
      if (!user.isPremium) {
        await storage.incrementPracticeCount(replitUserId);
      }

      res.json({
        message: aiResponse,
        practiceCount: user.isPremium ? null : user.practiceCount + 1,
        isPremium: user.isPremium
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
      const replitUserId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(replitUserId);
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

  // POST /api/subscription/create - Create subscription
  app.post('/api/subscription/create', isAuthenticated, async (req: any, res) => {
    try {
      const replitUserId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(replitUserId);
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

      // Update user premium status
      await storage.updateUserPremiumStatus(user.id, true, endDate);

      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

export { isAuthenticated };
