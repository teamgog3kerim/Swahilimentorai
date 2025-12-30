import { eq, and, desc, sql, count } from "drizzle-orm";
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
  type Visit,
  type InsertVisit,
  type AdminNotification,
  type InsertAdminNotification,
  users,
  lessons,
  userProgress,
  chatSessions,
  chatMessages,
  subscriptions,
  visits,
  adminNotifications,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithPassword(email: string, username: string, passwordHash: string): Promise<User>;
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
  
  getAllUsers(): Promise<User[]>;
  getPendingSubscriptions(): Promise<(Subscription & { user: User })[]>;
  getAllSubscriptions(): Promise<(Subscription & { user: User })[]>;
  updateSubscriptionStatus(subscriptionId: string, status: string): Promise<Subscription>;
  getSubscription(id: string): Promise<Subscription | undefined>;
  
  createVisit(visit: InsertVisit): Promise<Visit>;
  getAnalyticsOverview(): Promise<{ totalVisits: number; uniqueSessions: number; todayVisits: number }>;
  getTopCountries(limit?: number): Promise<{ countryCode: string; countryName: string; count: number }[]>;
  getTopBrowsers(limit?: number): Promise<{ browserName: string; count: number }[]>;
  getTopDevices(limit?: number): Promise<{ deviceType: string; count: number }[]>;
  getVisitsByDate(days?: number): Promise<{ date: string; count: number }[]>;
  
  createNotification(notification: InsertAdminNotification): Promise<AdminNotification>;
  getUnreadNotifications(): Promise<AdminNotification[]>;
  getAllNotifications(limit?: number): Promise<AdminNotification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(): Promise<void>;
  getUnreadNotificationCount(): Promise<number>;
  deleteNotification(id: string): Promise<void>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createUserWithPassword(email: string, username: string, passwordHash: string): Promise<User> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);
    
    const result = await db.insert(users).values({
      email,
      username,
      passwordHash,
      authProvider: "email",
      isPremium: true,
      subscriptionEndsAt: trialEndsAt,
    }).returning();
    return result[0];
  }

  async updateUserPremiumStatus(userId: string, isPremium: boolean, endsAt: Date | null): Promise<void> {
    await db.update(users).set({ isPremium, subscriptionEndsAt: endsAt }).where(eq(users.id, userId));
  }

  async incrementPracticeCount(userId: string): Promise<void> {
    const user = await this.getUser(userId);
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getPendingSubscriptions(): Promise<(Subscription & { user: User })[]> {
    const results = await db.select()
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(eq(subscriptions.status, 'pending'))
      .orderBy(desc(subscriptions.createdAt));
    
    return results.map(row => ({
      ...row.subscriptions,
      user: row.users,
    }));
  }

  async getAllSubscriptions(): Promise<(Subscription & { user: User })[]> {
    const results = await db.select()
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt));
    
    return results.map(row => ({
      ...row.subscriptions,
      user: row.users,
    }));
  }

  async updateSubscriptionStatus(subscriptionId: string, status: string): Promise<Subscription> {
    const result = await db.update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();
    return result[0];
  }

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);
    return result[0];
  }

  async createVisit(visit: InsertVisit): Promise<Visit> {
    const result = await db.insert(visits).values(visit).returning();
    return result[0];
  }

  async getAnalyticsOverview(): Promise<{ totalVisits: number; uniqueSessions: number; todayVisits: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalResult = await db.select({ count: count() }).from(visits);
    const totalVisits = totalResult[0]?.count || 0;
    
    const uniqueResult = await db.select({ count: sql<number>`COUNT(DISTINCT session_id)` }).from(visits);
    const uniqueSessions = uniqueResult[0]?.count || 0;
    
    const todayResult = await db.select({ count: count() }).from(visits)
      .where(sql`created_at >= ${today}`);
    const todayVisits = todayResult[0]?.count || 0;
    
    return { totalVisits, uniqueSessions, todayVisits };
  }

  async getTopCountries(limit: number = 10): Promise<{ countryCode: string; countryName: string; count: number }[]> {
    const result = await db.select({
      countryCode: visits.countryCode,
      countryName: visits.countryName,
      count: count(),
    })
    .from(visits)
    .where(sql`country_code IS NOT NULL`)
    .groupBy(visits.countryCode, visits.countryName)
    .orderBy(desc(count()))
    .limit(limit);
    
    return result.map(r => ({
      countryCode: r.countryCode || 'Unknown',
      countryName: r.countryName || 'Unknown',
      count: r.count,
    }));
  }

  async getTopBrowsers(limit: number = 10): Promise<{ browserName: string; count: number }[]> {
    const result = await db.select({
      browserName: visits.browserName,
      count: count(),
    })
    .from(visits)
    .where(sql`browser_name IS NOT NULL`)
    .groupBy(visits.browserName)
    .orderBy(desc(count()))
    .limit(limit);
    
    return result.map(r => ({
      browserName: r.browserName || 'Unknown',
      count: r.count,
    }));
  }

  async getTopDevices(limit: number = 10): Promise<{ deviceType: string; count: number }[]> {
    const result = await db.select({
      deviceType: visits.deviceType,
      count: count(),
    })
    .from(visits)
    .where(sql`device_type IS NOT NULL`)
    .groupBy(visits.deviceType)
    .orderBy(desc(count()))
    .limit(limit);
    
    return result.map(r => ({
      deviceType: r.deviceType || 'Unknown',
      count: r.count,
    }));
  }

  async getVisitsByDate(days: number = 30): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db.select({
      date: sql<string>`DATE(created_at)::text`,
      count: count(),
    })
    .from(visits)
    .where(sql`created_at >= ${startDate}`)
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);
    
    return result.map(r => ({
      date: r.date,
      count: r.count,
    }));
  }

  async createNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const result = await db.insert(adminNotifications).values(notification).returning();
    return result[0];
  }

  async getUnreadNotifications(): Promise<AdminNotification[]> {
    return await db.select().from(adminNotifications)
      .where(eq(adminNotifications.isRead, false))
      .orderBy(desc(adminNotifications.createdAt));
  }

  async getAllNotifications(limit: number = 50): Promise<AdminNotification[]> {
    return await db.select().from(adminNotifications)
      .orderBy(desc(adminNotifications.createdAt))
      .limit(limit);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.id, id));
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await db.update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.isRead, false));
  }

  async getUnreadNotificationCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(adminNotifications)
      .where(eq(adminNotifications.isRead, false));
    return result[0]?.count || 0;
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(adminNotifications).where(eq(adminNotifications.id, id));
  }
}

export const storage = new DbStorage();
