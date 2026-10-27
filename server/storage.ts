import { eq, and, desc, sql, count } from "drizzle-orm";
import { db } from "./db";
import { normalizeCourseContent } from "../shared/courseContent";
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
import { sessions } from "@shared/schema";
import { isOwnerEmail, mayLinkGoogleAccount } from "./accountPolicy";
import { learnerStories } from "@shared/schema";
import type { LearnerStoryInput } from "@shared/learnerStories";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithPassword(email: string, username: string, passwordHash: string): Promise<User>;
  updateUserPremiumStatus(userId: string, isPremium: boolean, endsAt: Date | null): Promise<void>;
  incrementPracticeCount(userId: string): Promise<void>;
  
  getAllLessons(language?: string): Promise<Lesson[]>;
  getLessonsByLevel(level: string, language?: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  
  getUserProgress(userId: string, language?: string): Promise<UserProgress[]>;
  upsertUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getUserChatSessions(userId: string, language?: string): Promise<ChatSession[]>;
  
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
  async getAdminLearnerStories() {
    return db.select().from(learnerStories).orderBy(desc(learnerStories.createdAt), learnerStories.id);
  }

  async getPublicLearnerStories() {
    // Explicit allowlist: never serialize contact information or consent records publicly.
    return db.select({
      id: learnerStories.id,
      learningLanguage: learnerStories.learningLanguage,
      displayNameZh: learnerStories.displayNameZh,
      displayNameEn: learnerStories.displayNameEn,
      quoteZh: learnerStories.quoteZh,
      quoteEn: learnerStories.quoteEn,
      contextZh: learnerStories.contextZh,
      contextEn: learnerStories.contextEn,
    }).from(learnerStories).where(and(
      eq(learnerStories.approved, true),
      eq(learnerStories.published, true),
      eq(learnerStories.consentGranted, true),
      sql`length(trim(${learnerStories.consentRecord})) > 0`,
    )).orderBy(desc(learnerStories.createdAt), learnerStories.id);
  }

  async saveLearnerStory(input: LearnerStoryInput, id?: string) {
    const values = { ...input, updatedAt: new Date() };
    if (!id) {
      const [story] = await db.insert(learnerStories).values(values).returning();
      return story;
    }
    return db.transaction(async (tx) => {
      // Lock the persisted version: clients cannot carry approval forward while
      // changing the reviewed content or its permission, including concurrent edits.
      const [current] = await tx.select().from(learnerStories)
        .where(eq(learnerStories.id, id)).for("update");
      if (!current) return undefined;
      const changed = (Object.keys(input) as (keyof LearnerStoryInput)[])
        .some(key => key !== "approved" && key !== "published" && current[key] !== input[key]);
      const [story] = await tx.update(learnerStories).set({
        ...values,
        ...(changed ? { approved: false, published: false } : {}),
      }).where(eq(learnerStories.id, id)).returning();
      return story;
    });
  }

  async deleteLearnerStory(id: string) {
    const deleted = await db.delete(learnerStories).where(eq(learnerStories.id, id)).returning({ id: learnerStories.id });
    return deleted.length > 0;
  }

  async signInWithGoogle(
    profile: { googleId: string; email: string; username: string; profileImageUrl: string | null },
    currentUserId?: string,
  ): Promise<User> {
    return db.transaction(async (tx) => {
      if (currentUserId) {
        const [current] = await tx.select().from(users).where(eq(users.id, currentUserId)).limit(1);
        if (!current || current.email.toLowerCase() !== profile.email) throw new Error("email_mismatch");
      }
      const [byGoogleId] = await tx.select().from(users).where(eq(users.googleId, profile.googleId)).limit(1);
      if (byGoogleId) return byGoogleId;
      const [existing] = await tx.select().from(users)
        .where(sql`lower(${users.email}) = ${profile.email}`).limit(1);
      const owner = isOwnerEmail(profile.email);
      if (existing) {
        if (!mayLinkGoogleAccount(existing, profile.googleId, currentUserId)) throw new Error("link_required");
        if (owner) {
          await tx.delete(sessions).where(sql`${sessions.sess}->'passport'->>'user' = ${existing.id}`);
        }
        const [linked] = await tx.update(users).set({
          googleId: profile.googleId,
          profileImageUrl: profile.profileImageUrl,
          ...(owner ? { isAdmin: true, passwordHash: null, authProvider: "google", isPremium: true, subscriptionEndsAt: null } : {}),
        }).where(eq(users.id, existing.id)).returning();
        return linked;
      }
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const [created] = await tx.insert(users).values({
        ...profile, authProvider: "google", isAdmin: owner,
        isPremium: true, subscriptionEndsAt: owner ? null : trialEndsAt,
      }).returning();
      return created;
    });
  }

  async updateManagedUser(id: string, values: {
    username: string; isAdmin: boolean; isPremium: boolean; subscriptionEndsAt: Date | null;
  }) {
    const [updated] = await db.update(users).set(values).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteManagedUser(id: string) {
    await db.transaction(async (tx) => {
      const userSessions = tx.select({ id: chatSessions.id }).from(chatSessions).where(eq(chatSessions.userId, id));
      await tx.delete(chatMessages).where(sql`${chatMessages.sessionId} in (${userSessions})`);
      await tx.delete(chatSessions).where(eq(chatSessions.userId, id));
      await tx.delete(userProgress).where(eq(userProgress.userId, id));
      await tx.delete(subscriptions).where(eq(subscriptions.userId, id));
      await tx.update(visits).set({ userId: null }).where(eq(visits.userId, id));
      await tx.delete(sessions).where(sql`${sessions.sess}->'passport'->>'user' = ${id}`);
      await tx.delete(users).where(eq(users.id, id));
    });
  }
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(sql`lower(${users.email}) = ${email.toLowerCase()}`).limit(1);
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

  async getAllLessons(language = "swahili"): Promise<Lesson[]> {
    const rows = await db.select().from(lessons).where(eq(lessons.language, language)).orderBy(lessons.orderIndex);
    return rows.map(lesson => ({ ...lesson, content: normalizeCourseContent(lesson.content as Record<string, any>, lesson.language, lesson.title) }));
  }

  async getLessonsByLevel(level: string, language = "swahili"): Promise<Lesson[]> {
    const rows = await db.select().from(lessons).where(and(eq(lessons.level, level), eq(lessons.language, language))).orderBy(lessons.orderIndex);
    return rows.map(lesson => ({ ...lesson, content: normalizeCourseContent(lesson.content as Record<string, any>, lesson.language, lesson.title) }));
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const result = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
    const lesson = result[0];
    return lesson ? { ...lesson, content: normalizeCourseContent(lesson.content as Record<string, any>, lesson.language, lesson.title) } : undefined;
  }

  async getUserProgress(userId: string, language = "swahili"): Promise<UserProgress[]> {
    const rows = await db.select({ progress: userProgress }).from(userProgress)
      .innerJoin(lessons, eq(userProgress.lessonId, lessons.id))
      .where(and(eq(userProgress.userId, userId), eq(lessons.language, language)));
    return rows.map((row) => row.progress);
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

  async getUserChatSessions(userId: string, language = "swahili"): Promise<ChatSession[]> {
    return await db.select().from(chatSessions).where(and(eq(chatSessions.userId, userId), eq(chatSessions.language, language))).orderBy(desc(chatSessions.createdAt));
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
