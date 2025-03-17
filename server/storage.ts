import { users, type User, type InsertUser, scans, type Scan, type InsertScan } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createScan(scan: Omit<InsertScan, "userId"> & { userId: number }): Promise<Scan>;
  getScan(id: number): Promise<Scan | undefined>;
  updateScan(id: number, data: Partial<Scan>): Promise<Scan>;
  getUserScans(userId: number): Promise<Scan[]>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scans: Map<number, Scan>;
  private currentUserId: number;
  private currentScanId: number;
  readonly sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.scans = new Map();
    this.currentUserId = 1;
    this.currentScanId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createScan(scan: Omit<InsertScan, "userId"> & { userId: number }): Promise<Scan> {
    const id = this.currentScanId++;
    const newScan: Scan = {
      id,
      userId: scan.userId,
      url: scan.url,
      status: 'pending',
      createdAt: new Date(),
      completedAt: null,
      results: null,
    };
    this.scans.set(id, newScan);
    return newScan;
  }

  async getScan(id: number): Promise<Scan | undefined> {
    return this.scans.get(id);
  }

  async updateScan(id: number, data: Partial<Scan>): Promise<Scan> {
    const scan = this.scans.get(id);
    if (!scan) throw new Error('Scan not found');
    
    const updatedScan = { ...scan, ...data };
    this.scans.set(id, updatedScan);
    return updatedScan;
  }

  async getUserScans(userId: number): Promise<Scan[]> {
    return Array.from(this.scans.values()).filter(
      (scan) => scan.userId === userId
    );
  }
}

export const storage = new MemStorage();
