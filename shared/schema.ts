import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const customRules = pgTable("custom_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pattern: text("pattern").notNull(), // 検出パターン（正規表現など）
  severity: text("severity").notNull(), // 'high' | 'medium' | 'low'
  category: text("category").notNull(), // 'header' | 'form' | 'content' など
  remediation: text("remediation").notNull(), // 修正ガイド
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isEnabled: boolean("is_enabled").notNull().default(true),
});

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  url: text("url").notNull(),
  status: text("status").notNull(), // 'pending', 'scanning', 'complete', 'failed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  results: json("results").$type<{
    vulnerabilities: Array<{
      type: string;
      severity: 'high' | 'medium' | 'low';
      name: string;
      description: string;
      location: string;
      remediation: string;
    }>;
    score: number;
    actionPlan: string[];
  }>(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertScanSchema = createInsertSchema(scans).pick({
  url: true,
});

export const insertCustomRuleSchema = createInsertSchema(customRules).pick({
  name: true,
  description: true,
  pattern: true,
  severity: true,
  category: true,
  remediation: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Scan = typeof scans.$inferSelect;
export type InsertScan = z.infer<typeof insertScanSchema>;
export type CustomRule = typeof customRules.$inferSelect;
export type InsertCustomRule = z.infer<typeof insertCustomRuleSchema>;