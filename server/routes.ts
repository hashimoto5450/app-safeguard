import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { scan as webScanner } from "@shared/scanners/webScanner";
import { insertScanSchema, insertCustomRuleSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // カスタムルール関連のエンドポイント
  app.post("/api/custom-rules", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const validatedData = insertCustomRuleSchema.parse(req.body);
      const rule = await storage.createCustomRule({
        ...validatedData,
        userId: req.user.id,
      });
      res.status(201).json(rule);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "An unknown error occurred" });
      }
    }
  });

  app.get("/api/custom-rules", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const rules = await storage.getUserCustomRules(req.user.id);
      res.json(rules);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  app.patch("/api/custom-rules/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const rule = await storage.getCustomRule(parseInt(req.params.id));
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      if (rule.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updatedRule = await storage.updateCustomRule(rule.id, req.body);
      res.json(updatedRule);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  app.delete("/api/custom-rules/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const rule = await storage.getCustomRule(parseInt(req.params.id));
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }
      if (rule.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await storage.deleteCustomRule(rule.id);
      res.sendStatus(200);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // 既存のスキャン関連のエンドポイント
  app.post("/api/scan", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const validatedData = insertScanSchema.parse(req.body);
      const scan = await storage.createScan({
        ...validatedData,
        userId: req.user.id,
      });

      // Non-blocking scan
      webScanner(scan.url)
        .then(async (results) => {
          await storage.updateScan(scan.id, {
            status: 'complete',
            completedAt: new Date(),
            results,
          });
        })
        .catch(async (error) => {
          await storage.updateScan(scan.id, {
            status: 'failed',
            completedAt: new Date(),
            results: {
              vulnerabilities: [],
              score: 0,
              actionPlan: [], // Added actionPlan to results
            },
          });
        });

      res.status(201).json(scan);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "An unknown error occurred" });
      }
    }
  });

  app.get("/api/scan/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const scan = await storage.getScan(parseInt(req.params.id));
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      if (scan.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      res.json(scan);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  app.get("/api/scans", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const scans = await storage.getUserScans(req.user.id);
      res.json(scans);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  app.post("/api/scans/clear", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      await storage.clearUserScans(req.user.id);
      res.sendStatus(200);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}