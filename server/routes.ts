import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertInterestedPartySchema, insertSearchedAddressSchema, insertCommunityQuestionSchema, insertDynamicFaqSchema, type BuildInfo } from "@shared/schema";

function generateUnsubscribeToken(): string {
  return randomBytes(32).toString("hex");
}

function loadBuildInfo(): BuildInfo {
  const possiblePaths = [
    join(process.cwd(), "build-info.json"),
    join(process.cwd(), "dist", "build-info.json"),
    "/home/runner/workspace/build-info.json",
  ];
  
  for (const buildInfoPath of possiblePaths) {
    try {
      if (existsSync(buildInfoPath)) {
        const content = readFileSync(buildInfoPath, "utf-8");
        const parsed = JSON.parse(content);
        console.log("[BUILD-INFO] Loaded from file:", buildInfoPath, parsed);
        return parsed as BuildInfo;
      }
    } catch (error) {
      console.warn("[BUILD-INFO] Could not load from", buildInfoPath, ":", error);
    }
  }
  
  const now = new Date();
  let gitCommit = "unknown";
  let commitCount = 0;
  
  try {
    gitCommit = execSync("git rev-parse --short HEAD").toString().trim();
    commitCount = parseInt(execSync("git rev-list --count HEAD").toString().trim(), 10);
    console.log("[BUILD-INFO] Generated from git:", { version: `1.1.${commitCount}`, gitCommit });
  } catch {
    console.log("[BUILD-INFO] Git not available, using fallback");
  }
  
  return {
    version: commitCount > 0 ? `1.1.${commitCount}` : "1.1.dev",
    buildDate: now.toISOString().split("T")[0],
    buildTime: now.toISOString(),
    gitCommit,
  };
}

const BUILD_INFO = loadBuildInfo();

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

interface TaxingBody {
  id: string;
  name: string;
  shortName: string;
  rate: number;
  description: string;
  color: string;
}

const TAXING_BODIES: TaxingBody[] = [
  {
    id: "elem_school",
    name: "Elementary School District",
    shortName: "Elem School",
    rate: 3.2145,
    description: "Funds K-8 education including teachers, facilities, and programs",
    color: "#3b82f6"
  },
  {
    id: "high_school",
    name: "High School District",
    shortName: "High School",
    rate: 2.4872,
    description: "Supports high school education, athletics, and extracurricular activities",
    color: "#8b5cf6"
  },
  {
    id: "community_college",
    name: "McHenry County College",
    shortName: "MCC",
    rate: 0.4521,
    description: "Community college providing higher education and workforce training",
    color: "#06b6d4"
  },
  {
    id: "county",
    name: "McHenry County",
    shortName: "County",
    rate: 0.5834,
    description: "County services including roads, courts, health department, and sheriff",
    color: "#10b981"
  },
  {
    id: "township",
    name: "Greenwood Township",
    shortName: "Township",
    rate: 0.1892,
    description: "Local road maintenance, general assistance, and assessor services",
    color: "#f59e0b"
  },
  {
    id: "fire",
    name: "Fire Protection District",
    shortName: "Fire District",
    rate: 0.8234,
    description: "Fire protection, emergency medical services, and rescue operations",
    color: "#ef4444"
  },
  {
    id: "park",
    name: "Park District",
    shortName: "Parks",
    rate: 0.3156,
    description: "Parks, recreation programs, and community facilities",
    color: "#22c55e"
  },
  {
    id: "library",
    name: "Library District",
    shortName: "Library",
    rate: 0.2347,
    description: "Public library services, programs, and resources",
    color: "#a855f7"
  },
  {
    id: "other",
    name: "Other Taxing Bodies",
    shortName: "Other",
    rate: 0.1823,
    description: "Conservation, mosquito abatement, and other special districts",
    color: "#6b7280"
  }
];

const TOTAL_NON_VILLAGE_RATE = TAXING_BODIES.reduce((sum, body) => sum + body.rate, 0);

interface TaxBreakdown {
  taxingBodies: Array<TaxingBody & { amount: number; percentage: number }>;
  villageLevyBody: TaxingBody & { amount: number; percentage: number };
  totalCurrentRate: number;
  totalPostAnnexationRate: number;
}

function calculateTaxBreakdown(eav: number, currentTax: number): TaxBreakdown {
  const currentEffectiveRate = currentTax > 0 && eav > 0 ? (currentTax / eav) * 100 : TOTAL_NON_VILLAGE_RATE;
  const rateMultiplier = currentEffectiveRate / TOTAL_NON_VILLAGE_RATE;
  
  const taxingBodiesWithAmounts = TAXING_BODIES.map(body => {
    const adjustedRate = body.rate * rateMultiplier;
    const amount = (eav / 100) * adjustedRate;
    return {
      ...body,
      rate: adjustedRate,
      amount,
      percentage: currentTax > 0 ? (amount / currentTax) * 100 : (body.rate / TOTAL_NON_VILLAGE_RATE) * 100
    };
  });

  const villageLevyAmount = (eav / 100) * VILLAGE_OF_WONDER_LAKE_LEVY_RATE;
  const totalPostAnnexation = currentTax + villageLevyAmount;
  
  const villageLevyBody = {
    id: "village",
    name: "Village of Wonder Lake",
    shortName: "Village",
    rate: VILLAGE_OF_WONDER_LAKE_LEVY_RATE,
    description: "Municipal services including water, roads, police, and village administration",
    color: "#0ea5e9",
    amount: villageLevyAmount,
    percentage: (villageLevyAmount / totalPostAnnexation) * 100
  };

  const adjustedBodiesForPostAnnexation = taxingBodiesWithAmounts.map(body => ({
    ...body,
    percentage: (body.amount / totalPostAnnexation) * 100
  }));

  return {
    taxingBodies: adjustedBodiesForPostAnnexation,
    villageLevyBody,
    totalCurrentRate: currentEffectiveRate,
    totalPostAnnexationRate: currentEffectiveRate + VILLAGE_OF_WONDER_LAKE_LEVY_RATE
  };
}

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

  app.post("/api/tax/breakdown", async (req: Request, res: Response) => {
    try {
      const { eav, currentTax } = req.body;
      
      if (typeof eav !== "number" || eav <= 0) {
        return res.status(400).json({ error: "Valid EAV (Equalized Assessed Value) is required" });
      }

      if (typeof currentTax !== "number" || currentTax < 0) {
        return res.status(400).json({ error: "Valid current tax amount is required" });
      }

      const breakdown = calculateTaxBreakdown(eav, currentTax);
      res.json(breakdown);
    } catch (error) {
      console.error("Tax breakdown error:", error);
      res.status(500).json({ error: "Failed to calculate tax breakdown" });
    }
  });

  app.get("/api/taxing-bodies", (_req: Request, res: Response) => {
    res.json({
      taxingBodies: TAXING_BODIES,
      villageLevyRate: VILLAGE_OF_WONDER_LAKE_LEVY_RATE,
      totalNonVillageRate: TOTAL_NON_VILLAGE_RATE,
      dataSource: "McHenry County Tax Extension Records (2024)",
      disclaimer: "Rates shown are averages for the Wonder Lake area. Your actual rates may vary based on specific taxing districts."
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

      // Generate unsubscribe token for privacy compliance
      const unsubscribeToken = generateUnsubscribeToken();
      const party = await storage.createInterestedParty({
        ...data,
        unsubscribeToken,
      });

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

  // Community questions routes (public submission)
  app.post("/api/questions", async (req: Request, res: Response) => {
    try {
      if (!checkRateLimit(req)) {
        return res.status(429).json({ 
          error: "Too many submissions. Please try again later.",
          message: "For security purposes, we limit submissions to 5 per hour." 
        });
      }

      const validationResult = insertCommunityQuestionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid data provided",
          details: validationResult.error.errors 
        });
      }

      const data = validationResult.data;
      
      // Generate unsubscribe token for privacy compliance
      const unsubscribeToken = generateUnsubscribeToken();
      const question = await storage.createCommunityQuestion({
        ...data,
        unsubscribeToken,
      });

      res.status(201).json({ 
        success: true,
        message: "Thank you for your question! We'll get back to you soon.",
        id: question.id 
      });
    } catch (error) {
      console.error("Error creating community question:", error);
      res.status(500).json({ error: "Failed to submit your question. Please try again." });
    }
  });

  // Dynamic FAQs routes (public)
  app.get("/api/dynamic-faqs", async (_req: Request, res: Response) => {
    try {
      const faqs = await storage.getDynamicFaqs();
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching dynamic FAQs:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  // Increment FAQ view count (public)
  app.post("/api/dynamic-faqs/:id/view", async (req: Request, res: Response) => {
    try {
      await storage.incrementFaqViewCount(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing view count:", error);
      res.status(500).json({ error: "Failed to update view count" });
    }
  });

  // Admin community questions routes
  app.get("/api/admin/questions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const questions = await storage.getCommunityQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching community questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Answer a community question (admin only)
  app.patch("/api/admin/questions/:id/answer", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { answer, editedQuestion, editedCategory } = req.body;
      if (!answer || typeof answer !== 'string' || answer.length < 10) {
        return res.status(400).json({ error: "Answer must be at least 10 characters" });
      }

      const question = await storage.answerCommunityQuestion(req.params.id, answer, editedQuestion, editedCategory);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      res.json(question);
    } catch (error) {
      console.error("Error answering question:", error);
      res.status(500).json({ error: "Failed to answer question" });
    }
  });

  // Publish question to FAQ (admin only)
  app.post("/api/admin/questions/:id/publish", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const faq = await storage.publishQuestionToFaq(req.params.id);
      if (!faq) {
        return res.status(400).json({ error: "Question must be answered before publishing" });
      }

      res.json(faq);
    } catch (error) {
      console.error("Error publishing question to FAQ:", error);
      res.status(500).json({ error: "Failed to publish to FAQ" });
    }
  });

  // Create dynamic FAQ directly (admin only)
  app.post("/api/admin/faqs", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validationResult = insertDynamicFaqSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid data provided",
          details: validationResult.error.errors 
        });
      }

      const faq = await storage.createDynamicFaq(validationResult.data);
      res.status(201).json(faq);
    } catch (error) {
      console.error("Error creating dynamic FAQ:", error);
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });

  // Delete community question (admin only)
  app.delete("/api/admin/questions/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.deleteCommunityQuestion(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting community question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  // Delete dynamic FAQ (admin only)
  app.delete("/api/admin/faqs/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.deleteDynamicFaq(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dynamic FAQ:", error);
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });

  // Mark FAQ as not new (admin only)
  app.patch("/api/admin/faqs/:id/not-new", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.markFaqNotNew(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking FAQ as not new:", error);
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  });

  // Build info endpoint - returns version and build timestamp
  app.get("/api/build-info", (_req: Request, res: Response) => {
    res.json(BUILD_INFO);
  });

  // Unsubscribe endpoint - allows users to opt out of communications
  app.post("/api/unsubscribe", async (req: Request, res: Response) => {
    try {
      const { token, type } = req.body;
      
      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Invalid unsubscribe token" });
      }

      if (!type || !["interested", "question"].includes(type)) {
        return res.status(400).json({ error: "Invalid unsubscribe type" });
      }

      let success = false;
      if (type === "interested") {
        success = await storage.unsubscribeParty(token);
      } else if (type === "question") {
        success = await storage.unsubscribeQuestion(token);
      }

      if (!success) {
        return res.status(404).json({ 
          error: "Subscription not found",
          message: "This unsubscribe link may have already been used or is invalid." 
        });
      }

      res.json({ 
        success: true, 
        message: "You have been successfully unsubscribed from our communications." 
      });
    } catch (error) {
      console.error("Error processing unsubscribe:", error);
      res.status(500).json({ error: "Failed to process unsubscribe request" });
    }
  });

  // Validate unsubscribe token - check if token is valid without actually unsubscribing
  app.get("/api/unsubscribe/validate", async (req: Request, res: Response) => {
    try {
      const { token, type } = req.query;
      
      if (!token || typeof token !== "string") {
        return res.status(400).json({ valid: false, error: "Invalid token" });
      }

      if (!type || !["interested", "question"].includes(type as string)) {
        return res.status(400).json({ valid: false, error: "Invalid type" });
      }

      let record = null;
      if (type === "interested") {
        record = await storage.getInterestedPartyByToken(token);
      } else if (type === "question") {
        record = await storage.getCommunityQuestionByToken(token);
      }

      if (!record) {
        return res.json({ valid: false, alreadyUnsubscribed: false });
      }

      res.json({ 
        valid: true, 
        alreadyUnsubscribed: record.unsubscribed ?? false,
        email: record.email.replace(/(.{2}).*(@.*)/, "$1***$2") // Mask email for privacy
      });
    } catch (error) {
      console.error("Error validating unsubscribe token:", error);
      res.status(500).json({ valid: false, error: "Failed to validate token" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
