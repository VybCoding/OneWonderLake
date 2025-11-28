import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { randomBytes } from "crypto";
import { Webhook } from "svix";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { sendEmail, getEmailContent, getEmailLimits } from "./resend";
import { insertInterestedPartySchema, insertSearchedAddressSchema, insertCommunityQuestionSchema, insertDynamicFaqSchema, type BuildInfo } from "@shared/schema";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function generateUnsubscribeToken(): string {
  return randomBytes(32).toString("hex");
}

function loadBuildInfo(): BuildInfo {
  const possiblePaths = [
    join(process.cwd(), "build-info.json"),
    join(process.cwd(), "dist", "build-info.json"),
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
    
    const buildInfo: BuildInfo = {
      version: `1.1.${commitCount}`,
      buildDate: now.toISOString().split("T")[0],
      buildTime: now.toISOString(),
      gitCommit,
    };
    
    const writePath = join(process.cwd(), "build-info.json");
    try {
      writeFileSync(writePath, JSON.stringify(buildInfo, null, 2));
      console.log("[BUILD-INFO] Written to:", writePath);
    } catch (writeError) {
      console.warn("[BUILD-INFO] Could not write file:", writeError);
    }
    
    return buildInfo;
  } catch {
    console.log("[BUILD-INFO] Git not available, using fallback");
  }
  
  return {
    version: "1.1.dev",
    buildDate: now.toISOString().split("T")[0],
    buildTime: now.toISOString(),
    gitCommit: "unknown",
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

  // Admin map data endpoint - returns coordinates for interested, not interested, and no-preference addresses
  app.get("/api/admin/map-data", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Get all interested parties with coordinates
      const parties = await storage.getInterestedParties();
      const interestedPins = parties
        .filter(p => p.latitude && p.longitude && p.interested === true)
        .map(p => ({
          id: p.id,
          latitude: p.latitude,
          longitude: p.longitude,
          address: p.address,
          name: p.name,
          type: "interested" as const,
          date: p.createdAt,
        }));

      const notInterestedPins = parties
        .filter(p => p.latitude && p.longitude && p.interested === false)
        .map(p => ({
          id: p.id,
          latitude: p.latitude,
          longitude: p.longitude,
          address: p.address,
          name: p.name,
          type: "not_interested" as const,
          date: p.createdAt,
        }));

      // Get all searched addresses
      const searchedAddrs = await storage.getSearchedAddresses();
      
      // Get set of addresses that have an interested party submission (case-insensitive)
      const partyAddresses = new Set(
        parties.map(p => p.address.toLowerCase().trim())
      );

      // Filter searched addresses that don't have a matching interested party
      const noPreferencePins = searchedAddrs
        .filter(s => 
          s.latitude && 
          s.longitude && 
          !partyAddresses.has(s.address.toLowerCase().trim())
        )
        .map(s => ({
          id: s.id,
          latitude: s.latitude,
          longitude: s.longitude,
          address: s.address,
          type: "no_preference" as const,
          result: s.result,
          date: s.createdAt,
        }));

      res.json({
        interested: interestedPins,
        notInterested: notInterestedPins,
        noPreference: noPreferencePins,
        summary: {
          interested: interestedPins.length,
          notInterested: notInterestedPins.length,
          noPreference: noPreferencePins.length,
          total: interestedPins.length + notInterestedPins.length + noPreferencePins.length,
        }
      });
    } catch (error) {
      console.error("Error fetching map data:", error);
      res.status(500).json({ error: "Failed to fetch map data" });
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

  // Email sending route (admin only) - Resend integration
  app.post("/api/admin/email/send", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { to, toName, subject, htmlBody, textBody, relatedType, relatedId, inReplyToEmailId } = req.body;
      
      if (!to || typeof to !== "string" || !to.includes("@")) {
        return res.status(400).json({ error: "Valid recipient email is required" });
      }
      
      if (!subject || typeof subject !== "string" || subject.length < 1) {
        return res.status(400).json({ error: "Subject is required" });
      }
      
      if (!htmlBody || typeof htmlBody !== "string" || htmlBody.length < 1) {
        return res.status(400).json({ error: "Email body is required" });
      }

      // Check email usage limits
      const currentMonth = getCurrentMonth();
      const usage = await storage.getCurrentMonthUsage();
      const limits = getEmailLimits();
      
      const totalEmails = (usage.sentCount || 0) + (usage.receivedCount || 0);
      
      if (usage.isShutoff) {
        return res.status(429).json({ 
          error: "Email sending is temporarily disabled",
          message: `Monthly email limit reached (${limits.autoShutoffThreshold}/${limits.monthlyLimit}). Contact support to continue.`,
          usage: { sent: usage.sentCount, received: usage.receivedCount, total: totalEmails }
        });
      }
      
      if (totalEmails >= limits.autoShutoffThreshold) {
        await storage.setEmailShutoff(currentMonth, true);
        return res.status(429).json({ 
          error: "Email limit reached",
          message: `Monthly email limit of ${limits.autoShutoffThreshold} reached. Email sending has been paused to stay within free tier.`,
          usage: { sent: usage.sentCount, received: usage.receivedCount, total: totalEmails }
        });
      }

      // Send email via Resend
      const result = await sendEmail(to, subject, htmlBody, textBody);
      
      if (result.error) {
        console.error("Email send error:", result.error);
        return res.status(500).json({ error: "Failed to send email", details: result.error });
      }

      // Increment sent count
      await storage.incrementSentCount(currentMonth);

      // Store email in correspondence log
      const emailRecord = await storage.createEmailCorrespondence({
        recipientEmail: to,
        recipientName: toName || null,
        subject,
        htmlBody,
        textBody: textBody || null,
        relatedType: relatedType || null,
        relatedId: relatedId || null,
        sentBy: userId,
        resendId: result.data?.id || null,
        status: "sent",
      });

      // If this is a reply to an inbound email, mark it as replied
      if (inReplyToEmailId) {
        await storage.markInboundEmailReplied(inReplyToEmailId, emailRecord.id);
      }

      res.json({ 
        success: true, 
        message: "Email sent successfully",
        emailId: emailRecord.id,
        resendId: result.data?.id
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Get email correspondence history (admin only)
  app.get("/api/admin/email/history", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const emails = await storage.getEmailCorrespondence();
      res.json(emails);
    } catch (error) {
      console.error("Error fetching email history:", error);
      res.status(500).json({ error: "Failed to fetch email history" });
    }
  });

  // Get inbound emails (admin only)
  app.get("/api/admin/email/inbox", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const emails = await storage.getInboundEmails();
      res.json(emails);
    } catch (error) {
      console.error("Error fetching inbound emails:", error);
      res.status(500).json({ error: "Failed to fetch inbox" });
    }
  });

  // Get single inbound email with content (admin only)
  app.get("/api/admin/email/inbox/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const email = await storage.getInboundEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }

      // Mark as read
      await storage.markInboundEmailRead(req.params.id);

      // If we don't have the full content, try to fetch it from Resend
      if (!email.htmlBody && !email.textBody && email.resendEmailId) {
        try {
          const content = await getEmailContent(email.resendEmailId);
          // Update our stored email with the content if we got it
          if (content) {
            return res.json({
              ...email,
              isRead: true,
              htmlBody: content.html || null,
              textBody: content.text || null,
            });
          }
        } catch (fetchError) {
          console.error("Could not fetch email content from Resend:", fetchError);
        }
      }

      res.json({ ...email, isRead: true });
    } catch (error) {
      console.error("Error fetching inbound email:", error);
      res.status(500).json({ error: "Failed to fetch email" });
    }
  });

  // Get email usage statistics (admin only)
  app.get("/api/admin/email/usage", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const usage = await storage.getCurrentMonthUsage();
      const limits = getEmailLimits();
      
      res.json({
        month: usage.month,
        sent: usage.sentCount || 0,
        received: usage.receivedCount || 0,
        total: (usage.sentCount || 0) + (usage.receivedCount || 0),
        monthlyLimit: limits.monthlyLimit,
        autoShutoffThreshold: limits.autoShutoffThreshold,
        isShutoff: usage.isShutoff || false,
        remaining: Math.max(0, limits.autoShutoffThreshold - ((usage.sentCount || 0) + (usage.receivedCount || 0))),
      });
    } catch (error) {
      console.error("Error fetching email usage:", error);
      res.status(500).json({ error: "Failed to fetch email usage" });
    }
  });

  // Delete inbound email (admin only)
  app.delete("/api/admin/email/inbox/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const email = await storage.getInboundEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }

      await storage.deleteInboundEmail(req.params.id);
      res.json({ success: true, message: "Email deleted" });
    } catch (error) {
      console.error("Error deleting inbound email:", error);
      res.status(500).json({ error: "Failed to delete email" });
    }
  });

  // Mark inbound email as read (admin only)
  app.patch("/api/admin/email/inbox/:id/read", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.markInboundEmailRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking email as read:", error);
      res.status(500).json({ error: "Failed to mark email as read" });
    }
  });

  // ========== CONTACTS ROUTES ==========
  
  // Get all contacts (admin only)
  app.get("/api/admin/contacts", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const contactList = await storage.getContacts();
      res.json(contactList);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  // Create a new contact (admin only)
  app.post("/api/admin/contacts", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const contact = await storage.createContact(req.body);
      res.json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  // Update a contact (admin only)
  app.patch("/api/admin/contacts/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const contact = await storage.updateContact(req.params.id, req.body);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  // Delete a contact (admin only)
  app.delete("/api/admin/contacts/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.deleteContact(req.params.id);
      res.json({ success: true, message: "Contact deleted" });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Seed contacts from existing data (admin only)
  app.post("/api/admin/contacts/seed", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      let seededCount = 0;

      // Get all interested parties and create contacts
      const parties = await storage.getInterestedParties();
      for (const party of parties) {
        const existing = await storage.getContactByEmail(party.email);
        if (!existing) {
          await storage.createContact({
            name: party.name,
            email: party.email,
            phone: party.phone || undefined,
            address: party.address || undefined,
            source: "interested_party",
            relatedEntityId: party.id,
            interestStatus: party.interested ? "interested" : "not_interested",
            contactConsent: party.contactConsent,
            marketingOptOut: false,
            unsubscribed: party.unsubscribed || false,
          });
          seededCount++;
        }
      }

      // Get all community questions and create contacts
      const questions = await storage.getCommunityQuestions();
      for (const question of questions) {
        const existing = await storage.getContactByEmail(question.email);
        if (!existing) {
          await storage.createContact({
            name: question.name,
            email: question.email,
            phone: question.phone || undefined,
            address: question.address || undefined,
            source: "community_question",
            relatedEntityId: question.id,
            interestStatus: "unknown",
            contactConsent: question.contactConsent,
            marketingOptOut: false,
            unsubscribed: question.unsubscribed || false,
          });
          seededCount++;
        }
      }

      // Get all inbound emails and create contacts
      const inbound = await storage.getInboundEmails();
      for (const email of inbound) {
        const existing = await storage.getContactByEmail(email.fromEmail);
        if (!existing) {
          await storage.createContact({
            name: email.fromName || email.fromEmail,
            email: email.fromEmail,
            source: "inbound_email",
            relatedEntityId: email.id,
            interestStatus: "unknown",
            contactConsent: false,
            marketingOptOut: false,
            unsubscribed: false,
          });
          seededCount++;
        }
      }

      res.json({ success: true, message: `Seeded ${seededCount} new contacts` });
    } catch (error) {
      console.error("Error seeding contacts:", error);
      res.status(500).json({ error: "Failed to seed contacts" });
    }
  });

  // Bulk send email to contacts (admin only)
  app.post("/api/admin/email/bulk-send", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { contactIds, subject, htmlBody, textBody } = req.body;

      if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
        return res.status(400).json({ error: "No contacts selected" });
      }

      if (!subject || !htmlBody) {
        return res.status(400).json({ error: "Subject and body are required" });
      }

      // Check usage limits
      const usage = await storage.getCurrentMonthUsage();
      const limits = getEmailLimits();
      const totalEmails = (usage.sentCount || 0) + (usage.receivedCount || 0);
      
      if (usage.isShutoff || totalEmails >= limits.autoShutoffThreshold) {
        return res.status(429).json({ 
          error: "Email sending is paused - monthly limit reached" 
        });
      }

      // Check if we have enough capacity for the bulk send
      const remainingCapacity = limits.autoShutoffThreshold - totalEmails;
      if (contactIds.length > remainingCapacity) {
        return res.status(429).json({ 
          error: `Cannot send ${contactIds.length} emails - only ${remainingCapacity} remaining this month` 
        });
      }

      let sentCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (const contactId of contactIds) {
        try {
          const contact = await storage.getContactById(contactId);
          if (!contact) {
            errors.push(`Contact ${contactId} not found`);
            continue;
          }

          // Skip if opted out or unsubscribed
          if (contact.marketingOptOut || contact.unsubscribed) {
            skippedCount++;
            continue;
          }

          // Send email
          const result = await resend.emails.send({
            from: "One Wonder Lake <contact@onewonderlake.com>",
            to: contact.email,
            subject: subject,
            html: htmlBody,
            text: textBody || undefined,
          });

          if (result.error) {
            errors.push(`Failed to send to ${contact.email}: ${result.error.message}`);
            continue;
          }

          // Record the email
          await storage.createEmailCorrespondence({
            recipientEmail: contact.email,
            recipientName: contact.name,
            subject: subject,
            htmlBody: htmlBody,
            textBody: textBody || null,
            relatedType: "bulk_send",
            relatedId: contactId,
            sentBy: userId,
            resendId: result.data?.id || null,
            status: "sent",
          });

          // Increment sent count
          const currentMonth = getCurrentMonth();
          await storage.incrementSentCount(currentMonth);
          sentCount++;

        } catch (emailError: any) {
          errors.push(`Error sending to contact ${contactId}: ${emailError.message}`);
        }
      }

      res.json({ 
        success: true, 
        message: `Sent ${sentCount} emails, skipped ${skippedCount} (opted out)`,
        sent: sentCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error sending bulk emails:", error);
      res.status(500).json({ error: "Failed to send bulk emails" });
    }
  });

  // Resend webhook endpoint for receiving inbound emails
  app.post("/api/webhooks/resend", async (req: Request, res: Response) => {
    try {
      // Verify webhook signature if secret is configured
      const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
      let event = req.body;
      
      if (webhookSecret) {
        const svixId = req.headers['svix-id'] as string;
        const svixTimestamp = req.headers['svix-timestamp'] as string;
        const svixSignature = req.headers['svix-signature'] as string;
        
        if (!svixId || !svixTimestamp || !svixSignature) {
          console.error("[RESEND WEBHOOK] Missing Svix headers");
          return res.status(401).json({ error: "Missing webhook signature headers" });
        }
        
        try {
          const wh = new Webhook(webhookSecret);
          // Note: req.body is already parsed, so we need to stringify it
          // For production, consider using express.raw() middleware for this route
          const payload = JSON.stringify(req.body);
          event = wh.verify(payload, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
          }) as any;
        } catch (verifyError) {
          console.error("[RESEND WEBHOOK] Signature verification failed:", verifyError);
          return res.status(401).json({ error: "Invalid webhook signature" });
        }
      } else {
        console.warn("[RESEND WEBHOOK] No webhook secret configured - accepting unverified request");
      }
      
      console.log("[RESEND WEBHOOK] Received event:", event.type);
      
      // Handle email.received event
      if (event.type === "email.received") {
        const data = event.data;
        
        // Check if we already processed this email
        const existing = await storage.getInboundEmailByResendId(data.email_id);
        if (existing) {
          console.log("[RESEND WEBHOOK] Email already processed:", data.email_id);
          return res.json({ success: true, message: "Already processed" });
        }

        // Check email usage limits before accepting
        const currentMonth = getCurrentMonth();
        const usage = await storage.getCurrentMonthUsage();
        const limits = getEmailLimits();
        const totalEmails = (usage.sentCount || 0) + (usage.receivedCount || 0);
        
        if (totalEmails >= limits.autoShutoffThreshold) {
          console.log("[RESEND WEBHOOK] Email limit reached, but still storing for reference");
        }

        // Parse the from address
        const fromMatch = data.from?.match(/^(.+?)\s*<(.+?)>$/) || [null, null, data.from];
        const fromName = fromMatch[1]?.trim() || null;
        const fromEmail = fromMatch[2]?.trim() || data.from;

        // Log the full data structure for debugging
        console.log("[RESEND WEBHOOK] Full email data keys:", Object.keys(data));
        
        // Store the inbound email with full content from Resend
        // Resend webhook sends: text (plain text body), html (HTML body)
        const inboundEmail = await storage.createInboundEmail({
          resendEmailId: data.email_id,
          fromEmail: fromEmail,
          fromName: fromName,
          toEmail: Array.isArray(data.to) ? data.to[0] : data.to,
          subject: data.subject || "(No Subject)",
          textBody: data.text || data.body || null, // Resend uses 'text' for plain text content
          htmlBody: data.html || null, // Resend uses 'html' for HTML content
          messageId: data.message_id || null,
          inReplyTo: data.in_reply_to || null,
          isRead: false,
          isReplied: false,
          replyEmailId: null,
          attachments: data.attachments || null,
          receivedAt: new Date(data.created_at || Date.now()),
        });
        
        console.log("[RESEND WEBHOOK] Email content stored - text:", !!data.text, "html:", !!data.html);

        // Increment received count
        await storage.incrementReceivedCount(currentMonth);

        console.log("[RESEND WEBHOOK] Stored inbound email:", inboundEmail.id);
        
        res.json({ success: true, emailId: inboundEmail.id });
      } else {
        // Handle other webhook events (delivery status, etc.)
        console.log("[RESEND WEBHOOK] Unhandled event type:", event.type);
        res.json({ success: true, message: "Event received" });
      }
    } catch (error) {
      console.error("[RESEND WEBHOOK] Error processing webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
