import { users, type User, type InsertUser, scans, type Scan, type InsertScan, customRules, type CustomRule, type InsertCustomRule } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createScan(scan: Omit<InsertScan, "userId"> & { userId: number }): Promise<Scan>;
  getScan(id: number): Promise<Scan | undefined>;
  updateScan(id: number, data: Partial<Scan>): Promise<Scan>;
  getUserScans(userId: number): Promise<Scan[]>;
  clearUserScans(userId: number): Promise<void>;

  // カスタムルール用のメソッドを追加
  createCustomRule(rule: Omit<InsertCustomRule, "userId"> & { userId: number }): Promise<CustomRule>;
  getCustomRule(id: number): Promise<CustomRule | undefined>;
  updateCustomRule(id: number, data: Partial<CustomRule>): Promise<CustomRule>;
  deleteCustomRule(id: number): Promise<void>;
  getUserCustomRules(userId: number): Promise<CustomRule[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createScan(scan: Omit<InsertScan, "userId"> & { userId: number }): Promise<Scan> {
    const [newScan] = await db
      .insert(scans)
      .values({
        ...scan,
        status: 'pending',
        createdAt: new Date(),
      })
      .returning();
    return newScan;
  }

  async getScan(id: number): Promise<Scan | undefined> {
    const [scan] = await db.select().from(scans).where(eq(scans.id, id));
    return scan;
  }

  async updateScan(id: number, data: Partial<Scan>): Promise<Scan> {
    const [updatedScan] = await db
      .update(scans)
      .set(data)
      .where(eq(scans.id, id))
      .returning();

    if (!updatedScan) throw new Error('Scan not found');
    return updatedScan;
  }

  async getUserScans(userId: number): Promise<Scan[]> {
    return db.select().from(scans).where(eq(scans.userId, userId));
  }

  async clearUserScans(userId: number): Promise<void> {
    await db.delete(scans).where(eq(scans.userId, userId));
  }

  async createCustomRule(rule: Omit<InsertCustomRule, "userId"> & { userId: number }): Promise<CustomRule> {
    const [newRule] = await db
      .insert(customRules)
      .values({
        ...rule,
        createdAt: new Date(),
      })
      .returning();
    return newRule;
  }

  async getCustomRule(id: number): Promise<CustomRule | undefined> {
    const [rule] = await db.select().from(customRules).where(eq(customRules.id, id));
    return rule;
  }

  async updateCustomRule(id: number, data: Partial<CustomRule>): Promise<CustomRule> {
    const [updatedRule] = await db
      .update(customRules)
      .set(data)
      .where(eq(customRules.id, id))
      .returning();

    if (!updatedRule) throw new Error('Custom rule not found');
    return updatedRule;
  }

  async deleteCustomRule(id: number): Promise<void> {
    await db.delete(customRules).where(eq(customRules.id, id));
  }

  async getUserCustomRules(userId: number): Promise<CustomRule[]> {
    return db.select().from(customRules).where(eq(customRules.userId, userId));
  }
}

export const storage = new DatabaseStorage();