import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  type User,
  type InsertUser,
  type Lesson,
  type InsertLesson,
  type UserProgress,
  type InsertUserProgress,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type Subscription,
  type InsertSubscription,
  users,
  lessons,
  userProgress,
  chatSessions,
  chatMessages,
  subscriptions,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByReplitId(replitUserId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser): Promise<User>;
  updateUserPremiumStatus(userId: string, isPremium: boolean, endsAt: Date | null): Promise<void>;
  incrementPracticeCount(userId: string): Promise<void>;
  
  getAllLessons(): Promise<Lesson[]>;
  getLessonsByLevel(level: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  
  getUserProgress(userId: string): Promise<UserProgress[]>;
  upsertUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getUserChatSessions(userId: string): Promise<ChatSession[]>;
  
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getUserActiveSubscription(userId: string): Promise<Subscription | undefined>;
  getSubscriptionByTransactionId(transactionId: string): Promise<Subscription | undefined>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByReplitId(replitUserId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.replitUserId, replitUserId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.replitUserId,
        set: {
          username: userData.username,
          email: userData.email,
        },
      })
      .returning();
    return result[0];
  }

  async updateUserPremiumStatus(userId: string, isPremium: boolean, endsAt: Date | null): Promise<void> {
    await db.update(users).set({ isPremium, subscriptionEndsAt: endsAt }).where(eq(users.id, userId));
  }

  async incrementPracticeCount(userId: string): Promise<void> {
    const user = await this.getUserByReplitId(userId);
    if (user) {
      await db.update(users).set({ practiceCount: (user.practiceCount || 0) + 1 }).where(eq(users.id, user.id));
    }
  }

  async getAllLessons(): Promise<Lesson[]> {
    return await db.select().from(lessons).orderBy(lessons.orderIndex);
  }

  async getLessonsByLevel(level: string): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.level, level)).orderBy(lessons.orderIndex);
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const result = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
    return result[0];
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async upsertUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const existing = await db.select().from(userProgress)
      .where(and(eq(userProgress.userId, progress.userId), eq(userProgress.lessonId, progress.lessonId)))
      .limit(1);
    
    if (existing.length > 0) {
      const result = await db.update(userProgress)
        .set({ ...progress, lastAccessedAt: new Date() })
        .where(eq(userProgress.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(userProgress).values(progress).returning();
      return result[0];
    }
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const result = await db.insert(chatSessions).values(session).returning();
    return result[0];
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const result = await db.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1);
    return result[0];
  }

  async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    return await db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.createdAt));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt);
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(subscription).returning();
    return result[0];
  }

  async getUserActiveSubscription(userId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .orderBy(desc(subscriptions.endDate))
      .limit(1);
    return result[0];
  }

  async getSubscriptionByTransactionId(transactionId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions)
      .where(eq(subscriptions.transactionId, transactionId))
      .limit(1);
    return result[0];
  }
}

export const storage = new DbStorage();
