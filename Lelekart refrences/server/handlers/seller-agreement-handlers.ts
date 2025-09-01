import { Request, Response } from "express";
import { db } from "../db";
import { eq, desc, and, isNull } from "drizzle-orm";
import { sellerAgreements, acceptedAgreements, systemSettings } from "@shared/schema";
import type { SellerAgreement } from "@shared/schema";
import { z } from "zod";

// Checks if a seller has accepted the latest agreement
export async function checkSellerAgreementStatus(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // First check if agreement requirement is enabled in system settings
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "seller_agreement_required"))
      .limit(1);
    
    // If setting doesn't exist or is set to false, agreements not required
    if (!setting || setting.value.toLowerCase() !== "true") {
      return res.status(200).json({
        agreementRequired: false,
        hasAcceptedLatest: true,
        needsToAccept: false,
      });
    }

    const sellerId = req.user.id;

    // Get the latest agreement
    const [latestAgreement] = await db
      .select()
      .from(sellerAgreements)
      .orderBy(desc(sellerAgreements.version))
      .limit(1);

    if (!latestAgreement) {
      // No agreements exist yet
      return res.status(200).json({
        agreementRequired: true,
        hasAcceptedLatest: true,
        needsToAccept: false,
      });
    }

    // Check if the seller has accepted the latest agreement
    const [acceptedLatest] = await db
      .select()
      .from(acceptedAgreements)
      .where(
        and(
          eq(acceptedAgreements.sellerId, sellerId),
          eq(acceptedAgreements.agreementId, latestAgreement.id)
        )
      )
      .limit(1);

    return res.status(200).json({
      agreementRequired: true,
      hasAcceptedLatest: !!acceptedLatest,
      needsToAccept: !acceptedLatest,
    });
  } catch (error) {
    console.error("Error checking seller agreement status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get the latest agreement content
export async function getLatestAgreement(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    // First check if agreement requirement is enabled in system settings
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "seller_agreement_required"))
      .limit(1);
    
    // Include the requirement status in response
    const agreementRequired = setting?.value?.toLowerCase() === "true";

    // Get the latest agreement
    const [latestAgreement] = await db
      .select()
      .from(sellerAgreements)
      .orderBy(desc(sellerAgreements.version))
      .limit(1);

    if (!latestAgreement) {
      return res.status(404).json({ 
        error: "No agreements found",
        agreementRequired 
      });
    }

    // Check if the seller has accepted this agreement
    const [accepted] = await db
      .select()
      .from(acceptedAgreements)
      .where(
        and(
          eq(acceptedAgreements.sellerId, req.user.id),
          eq(acceptedAgreements.agreementId, latestAgreement.id)
        )
      )
      .limit(1);

    // Add isAccepted and agreementRequired fields to the response
    const agreementWithAcceptedStatus = {
      ...latestAgreement,
      isAccepted: !!accepted,
      agreementRequired
    };

    return res.status(200).json(agreementWithAcceptedStatus);
  } catch (error) {
    console.error("Error fetching latest agreement:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Accept an agreement
export async function acceptAgreement(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.status(403).json({ error: "Not authorized" });
    }

    const schema = z.object({
      agreementId: z.number(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { agreementId } = result.data;
    const sellerId = req.user.id;

    // Verify the agreement exists
    const [agreement] = await db
      .select()
      .from(sellerAgreements)
      .where(eq(sellerAgreements.id, agreementId))
      .limit(1);

    if (!agreement) {
      return res.status(404).json({ error: "Agreement not found" });
    }

    // Check if already accepted
    const [existingAcceptance] = await db
      .select()
      .from(acceptedAgreements)
      .where(
        and(
          eq(acceptedAgreements.sellerId, sellerId),
          eq(acceptedAgreements.agreementId, agreementId)
        )
      )
      .limit(1);

    if (existingAcceptance) {
      return res.status(409).json({ error: "Agreement already accepted" });
    }

    // Record the agreement acceptance
    const ipAddress = req.ip || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    await db.insert(acceptedAgreements).values({
      sellerId,
      agreementId,
      ipAddress,
      userAgent,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error accepting agreement:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Admin handlers for agreement management

// Get all agreements for admin
export async function getAllAgreements(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get agreement requirement setting
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "seller_agreement_required"))
      .limit(1);
      
    const agreementRequired = setting?.value?.toLowerCase() === "true";

    // Get all agreements ordered by version (descending)
    const agreements = await db
      .select()
      .from(sellerAgreements)
      .orderBy(desc(sellerAgreements.version));

    if (agreements.length > 0) {
      // Mark the latest version
      const latestVersionStr = agreements[0].version;
      const enhancedAgreements = agreements.map((agreement) => ({
        ...agreement,
        isLatest: agreement.version === latestVersionStr,
      }));

      return res.status(200).json({
        agreements: enhancedAgreements,
        agreementRequired,
        settingId: setting?.id
      });
    }

    return res.status(200).json({
      agreements: [],
      agreementRequired,
      settingId: setting?.id
    });
  } catch (error) {
    console.error("Error fetching all agreements:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Create a new agreement
export async function createAgreement(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    const schema = z.object({
      version: z.number(),
      content: z.string().min(10),
      title: z.string().optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { version, content, title = "Seller Agreement" } = result.data;

    // Check if this version already exists
    const [existingVersion] = await db
      .select()
      .from(sellerAgreements)
      .where(eq(sellerAgreements.version, String(version)))
      .limit(1);

    if (existingVersion) {
      return res.status(409).json({ error: "This version already exists" });
    }

    // Create the new agreement
    const [newAgreement] = await db
      .insert(sellerAgreements)
      .values({
        version: String(version),
        content,
        title,
        isActive: true,
      })
      .returning();

    return res.status(201).json(newAgreement);
  } catch (error) {
    console.error("Error creating agreement:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update an existing agreement
export async function updateAgreement(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    const agreementId = parseInt(req.params.id);
    if (isNaN(agreementId)) {
      return res.status(400).json({ error: "Invalid agreement ID" });
    }

    const schema = z.object({
      version: z.number().optional(),
      content: z.string().min(10).optional(),
      title: z.string().optional(),
      isActive: z.boolean().optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const updates = result.data;

    // If version is provided, check if it would conflict
    if (updates.version !== undefined) {
      const versionStr = String(updates.version);
      const [existingWithVersion] = await db
        .select()
        .from(sellerAgreements)
        .where(
          and(
            eq(sellerAgreements.version, versionStr),
            eq(sellerAgreements.id, agreementId).not()
          )
        )
        .limit(1);

      if (existingWithVersion) {
        return res.status(409).json({ error: "This version already exists" });
      }
    }

    // Check if the agreement exists
    const [existingAgreement] = await db
      .select()
      .from(sellerAgreements)
      .where(eq(sellerAgreements.id, agreementId))
      .limit(1);

    if (!existingAgreement) {
      return res.status(404).json({ error: "Agreement not found" });
    }

    // Prepare the update data with new updatedAt timestamp
    const updateData: Partial<SellerAgreement> = {
      ...updates,
      updatedAt: new Date(),
    };

    // Convert version to string if provided
    if (updates.version !== undefined) {
      updateData.version = String(updates.version);
    }

    // Update the agreement
    const [updatedAgreement] = await db
      .update(sellerAgreements)
      .set(updateData)
      .where(eq(sellerAgreements.id, agreementId))
      .returning();

    return res.status(200).json(updatedAgreement);
  } catch (error) {
    console.error("Error updating agreement:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// MIDDLEWARE for protecting seller routes
export function requireLatestAgreementAcceptance(req: Request, res: Response, next: Function) {
  // Skip if not authenticated or not a seller
  if (!req.isAuthenticated() || req.user.role !== "seller") {
    return next();
  }

  const checkSellerAgreement = async () => {
    try {
      // First check if agreement requirement is enabled in system settings
      const [setting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "seller_agreement_required"))
        .limit(1);
      
      // If setting doesn't exist or is set to false, skip agreement check
      if (!setting || setting.value.toLowerCase() !== "true") {
        console.log("Seller agreement requirement is disabled in system settings");
        return next();
      }
      
      const sellerId = req.user.id;

      // Get the latest agreement
      const [latestAgreement] = await db
        .select()
        .from(sellerAgreements)
        .orderBy(desc(sellerAgreements.version))
        .limit(1);

      // If no agreement exists, proceed
      if (!latestAgreement) {
        return next();
      }

      // Check if the seller has accepted this agreement
      const [accepted] = await db
        .select()
        .from(acceptedAgreements)
        .where(
          and(
            eq(acceptedAgreements.sellerId, sellerId),
            eq(acceptedAgreements.agreementId, latestAgreement.id)
          )
        )
        .limit(1);

      if (!accepted) {
        // If agreement check route, allow access so they can check
        if (
          req.path === "/api/seller/agreements/status" ||
          req.path === "/api/seller/agreements/latest" ||
          req.path === "/api/seller/agreements/accept"
        ) {
          return next();
        }
        
        // Otherwise block access
        return res.status(403).json({
          error: "Seller agreement not accepted",
          code: "AGREEMENT_REQUIRED",
        });
      }

      // Agreement is accepted, proceed
      return next();
    } catch (error) {
      console.error("Error in agreement middleware:", error);
      // In case of error, let the request proceed rather than breaking functionality
      return next();
    }
  };

  checkSellerAgreement();
}