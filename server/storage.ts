import { eq, and, desc, sql, gte } from "drizzle-orm";
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
  type StudyGroup,
  type InsertStudyGroup,
  type StudyGroupMember,
  type InsertStudyGroupMember,
  users,
  lessons,
  userProgress,
  chatSessions,
  chatMessages,
  subscriptions,
  studyGroups,
  studyGroupMembers,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByReplitId(replitUserId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser): Promise<User>;
  updateUserPremiumStatus(userId: string, isPremium: boolean, endsAt: Date | null): Promise<void>;
  incrementPracticeCount(userId: string): Promise<void>;
  updateUserStats(userId: string, stats: { totalPoints?: number; lessonsCompleted?: number; practiceMinutes?: number; currentStreak?: number; longestStreak?: number; lastActiveAt?: Date }): Promise<void>;
  
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
  
  getLeaderboard(type: 'weekly' | 'allTime', limit: number): Promise<User[]>;
  getUserRank(userId: string): Promise<number>;
  
  createStudyGroup(group: InsertStudyGroup): Promise<StudyGroup>;
  getStudyGroups(): Promise<StudyGroup[]>;
  getStudyGroup(id: string): Promise<StudyGroup | undefined>;
  joinStudyGroup(groupId: string, userId: string): Promise<StudyGroupMember>;
  leaveStudyGroup(groupId: string, userId: string): Promise<void>;
  getStudyGroupMembers(groupId: string): Promise<(StudyGroupMember & { user: User })[]>;
  getUserStudyGroups(userId: string): Promise<StudyGroup[]>;
  isUserInGroup(groupId: string, userId: string): Promise<boolean>;
  getGroupMemberCount(groupId: string): Promise<number>;
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
    const existing = await this.getUserByReplitId(userData.replitUserId);
    
    if (existing) {
      const result = await db
        .update(users)
        .set({
          username: userData.username,
          email: userData.email,
        })
        .where(eq(users.replitUserId, userData.replitUserId))
        .returning();
      return result[0];
    } else {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      
      const result = await db
        .insert(users)
        .values({
          ...userData,
          isPremium: true,
          subscriptionEndsAt: trialEndsAt,
        })
        .returning();
      return result[0];
    }
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

  async updateUserStats(userId: string, stats: { totalPoints?: number; lessonsCompleted?: number; practiceMinutes?: number; currentStreak?: number; longestStreak?: number; lastActiveAt?: Date }): Promise<void> {
    await db.update(users).set(stats).where(eq(users.id, userId));
  }

  async getLeaderboard(type: 'weekly' | 'allTime', limit: number): Promise<User[]> {
    if (type === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return await db.select().from(users)
        .where(gte(users.lastActiveAt, oneWeekAgo))
        .orderBy(desc(users.totalPoints))
        .limit(limit);
    }
    return await db.select().from(users)
      .orderBy(desc(users.totalPoints))
      .limit(limit);
  }

  async getUserRank(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.totalPoints} > ${user.totalPoints}`);
    return (result[0]?.count || 0) + 1;
  }

  async createStudyGroup(group: InsertStudyGroup): Promise<StudyGroup> {
    const result = await db.insert(studyGroups).values(group).returning();
    await db.insert(studyGroupMembers).values({
      groupId: result[0].id,
      userId: group.createdBy,
      role: 'admin',
    });
    return result[0];
  }

  async getStudyGroups(): Promise<StudyGroup[]> {
    return await db.select().from(studyGroups)
      .where(eq(studyGroups.isPublic, true))
      .orderBy(desc(studyGroups.createdAt));
  }

  async getStudyGroup(id: string): Promise<StudyGroup | undefined> {
    const result = await db.select().from(studyGroups).where(eq(studyGroups.id, id)).limit(1);
    return result[0];
  }

  async joinStudyGroup(groupId: string, userId: string): Promise<StudyGroupMember> {
    const result = await db.insert(studyGroupMembers).values({
      groupId,
      userId,
      role: 'member',
    }).returning();
    return result[0];
  }

  async leaveStudyGroup(groupId: string, userId: string): Promise<void> {
    await db.delete(studyGroupMembers)
      .where(and(eq(studyGroupMembers.groupId, groupId), eq(studyGroupMembers.userId, userId)));
  }

  async getStudyGroupMembers(groupId: string): Promise<(StudyGroupMember & { user: User })[]> {
    const result = await db.select({
      id: studyGroupMembers.id,
      groupId: studyGroupMembers.groupId,
      userId: studyGroupMembers.userId,
      role: studyGroupMembers.role,
      joinedAt: studyGroupMembers.joinedAt,
      user: users,
    })
      .from(studyGroupMembers)
      .innerJoin(users, eq(studyGroupMembers.userId, users.id))
      .where(eq(studyGroupMembers.groupId, groupId));
    return result;
  }

  async getUserStudyGroups(userId: string): Promise<StudyGroup[]> {
    const result = await db.select({ group: studyGroups })
      .from(studyGroupMembers)
      .innerJoin(studyGroups, eq(studyGroupMembers.groupId, studyGroups.id))
      .where(eq(studyGroupMembers.userId, userId));
    return result.map(r => r.group);
  }

  async isUserInGroup(groupId: string, userId: string): Promise<boolean> {
    const result = await db.select().from(studyGroupMembers)
      .where(and(eq(studyGroupMembers.groupId, groupId), eq(studyGroupMembers.userId, userId)))
      .limit(1);
    return result.length > 0;
  }

  async getGroupMemberCount(groupId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(studyGroupMembers)
      .where(eq(studyGroupMembers.groupId, groupId));
    return result[0]?.count || 0;
  }
}

export const storage = new DbStorage();
