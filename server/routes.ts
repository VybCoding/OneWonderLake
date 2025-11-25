import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertInterestedPartySchema, insertSearchedAddressSchema } from "@shared/schema";

const submissionCounts = new Map<string, { count: number; firstSubmission: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_HOUR = 5;

function getRateLimitKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.ip || 'unknown';
  return ip;
}

function checkRateLimit(req: Request): boolean {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const record = submissionCounts.get(key);
  
  if (!record || now - record.firstSubmission > RATE_LIMIT_WINDOW) {
    submissionCounts.set(key, { count: 1, firstSubmission: now });
    return true;
  }
  
  if (record.count >= MAX_SUBMISSIONS_PER_HOUR) {
    return false;
  }
  
  record.count++;
  return true;
}

interface TaxEstimate {
  currentTax: number;
  estimatedPostAnnexationTax: number;
  villageLevyAmount: number;
  villageLevyRate: number;
  eav: number;
  difference: number;
  percentIncrease: number;
  monthlyIncrease: number;
}

const VILLAGE_OF_WONDER_LAKE_LEVY_RATE = 0.2847;

function calculatePostAnnexationTax(eav: number, currentTax: number): TaxEstimate {
  const villageLevyAmount = (eav / 100) * VILLAGE_OF_WONDER_LAKE_LEVY_RATE;
  const estimatedPostAnnexationTax = currentTax + villageLevyAmount;
  const difference = villageLevyAmount;
  const percentIncrease = currentTax > 0 
    ? (difference / currentTax) * 100 
    : 0;
  const monthlyIncrease = villageLevyAmount / 12;

  return {
    currentTax,
    estimatedPostAnnexationTax,
    villageLevyAmount,
    villageLevyRate: VILLAGE_OF_WONDER_LAKE_LEVY_RATE,
    eav,
    difference,
    percentIncrease,
    monthlyIncrease
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Tax estimation routes
  app.post("/api/tax/estimate", async (req: Request, res: Response) => {
    try {
      const { eav, currentTax } = req.body;
      
      if (typeof eav !== "number" || eav <= 0) {
        return res.status(400).json({ error: "Valid EAV (Equalized Assessed Value) is required" });
      }

      if (typeof currentTax !== "number" || currentTax < 0) {
        return res.status(400).json({ error: "Valid current tax amount is required" });
      }

      const estimate = calculatePostAnnexationTax(eav, currentTax);
      res.json(estimate);
    } catch (error) {
      console.error("Tax estimate error:", error);
      res.status(500).json({ error: "Failed to calculate tax estimate" });
    }
  });

  app.get("/api/village-tax-info", (_req: Request, res: Response) => {
    res.json({
      villageName: "Village of Wonder Lake",
      levyRate: VILLAGE_OF_WONDER_LAKE_LEVY_RATE,
      levyRateDescription: "$0.2847 per $100 of EAV",
      dataSource: "McHenry County Tax Extension Records",
      lastUpdated: "2024",
      mchenryCountyPortalUrl: "https://mchenryil.devnetwedge.com/search",
      notes: [
        "This is the municipal portion only - does not include other taxing districts",
        "Rate based on 2024 tax levy data for properties within Village limits",
        "Your actual rate may vary based on specific location and applicable districts",
        "Look up your EAV and current taxes on the McHenry County Property Tax Inquiry portal"
      ]
    });
  });

  // Searched addresses tracking (public - for analytics)
  app.post("/api/searched-address", async (req: Request, res: Response) => {
    try {
      const validationResult = insertSearchedAddressSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid data provided",
          details: validationResult.error.errors 
        });
      }

      const data = validationResult.data;
      await storage.createSearchedAddress(data);

      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error saving searched address:", error);
      res.status(500).json({ error: "Failed to save searched address" });
    }
  });

  // Interested parties routes (public submission)
  app.post("/api/interested", async (req: Request, res: Response) => {
    try {
      if (!checkRateLimit(req)) {
        return res.status(429).json({ 
          error: "Too many submissions. Please try again later.",
          message: "For security purposes, we limit submissions to 5 per hour." 
        });
      }

      const validationResult = insertInterestedPartySchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid data provided",
          details: validationResult.error.errors 
        });
      }

      const data = validationResult.data;

      // Check if email already exists
      const existing = await storage.getInterestedPartyByEmail(data.email);
      if (existing) {
        return res.status(409).json({ 
          error: "This email address has already been registered",
          message: "Thank you! You're already on our list." 
        });
      }

      const party = await storage.createInterestedParty(data);

      // NOTE: Email sending is not configured. 
      // To enable thank-you emails, set up Resend or another email service integration.
      // See replit.md for configuration instructions.

      res.status(201).json({ 
        success: true,
        message: "Thank you for your interest! We'll be in touch soon.",
        id: party.id 
      });
    } catch (error) {
      console.error("Error creating interested party:", error);
      res.status(500).json({ error: "Failed to register your interest. Please try again." });
    }
  });

  // Admin routes (protected - requires authentication)
  app.get("/api/admin/interested", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const parties = await storage.getInterestedParties();
      res.json(parties);
    } catch (error) {
      console.error("Error fetching interested parties:", error);
      res.status(500).json({ error: "Failed to fetch interested parties" });
    }
  });

  // Check if current user is admin
  app.get("/api/admin/check", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({ isAdmin: user?.isAdmin ?? false });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });

  // Get searched addresses (admin only)
  app.get("/api/admin/searched-addresses", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const addresses = await storage.getSearchedAddresses();
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching searched addresses:", error);
      res.status(500).json({ error: "Failed to fetch searched addresses" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
