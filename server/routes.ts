import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

  const httpServer = createServer(app);
  return httpServer;
}
