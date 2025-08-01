import { Request, Response } from "express";
import { storage } from "../storage";
import { InsertReturn } from "@shared/schema";
import { z } from "zod";

// Get all returns for a seller
export async function getSellerReturnsHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(req.params.sellerId || req.user?.id?.toString() || "0");
    
    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }
    
    const returns = await storage.getReturnsForSeller(sellerId);
    
    return res.status(200).json(returns);
  } catch (error) {
    console.error("Error fetching seller returns:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get a specific return by ID
export async function getReturnByIdHandler(req: Request, res: Response) {
  try {
    const returnId = parseInt(req.params.id);
    
    if (isNaN(returnId)) {
      return res.status(400).json({ error: 'Invalid return ID' });
    }
    
    const returnData = await storage.getReturnById(returnId);
    
    if (!returnData) {
      return res.status(404).json({ error: 'Return not found' });
    }
    
    // Check if the requesting user is the seller of this return
    if (req.user?.role !== 'admin' && req.user?.id !== returnData.sellerId) {
      return res.status(403).json({ error: 'You do not have permission to view this return' });
    }
    
    return res.status(200).json(returnData);
  } catch (error) {
    console.error("Error fetching return:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Create a new return request
export async function createReturnHandler(req: Request, res: Response) {
  try {
    const returnSchema = z.object({
      orderId: z.number(),
      productId: z.number(),
      sellerId: z.number(),
      returnReason: z.string().min(1),
      comments: z.string().optional(),
      refundAmount: z.number().optional(),
    });
    
    const validatedData = returnSchema.parse(req.body);
    
    const newReturn = await storage.createReturn(validatedData as InsertReturn);
    
    return res.status(201).json(newReturn);
  } catch (error) {
    console.error("Error creating return:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update return status
export async function updateReturnStatusHandler(req: Request, res: Response) {
  try {
    const returnId = parseInt(req.params.id);
    
    if (isNaN(returnId)) {
      return res.status(400).json({ error: 'Invalid return ID' });
    }
    
    const returnData = await storage.getReturnById(returnId);
    
    if (!returnData) {
      return res.status(404).json({ error: 'Return not found' });
    }
    
    // Check if the requesting user is the seller of this return
    if (req.user?.role !== 'admin' && req.user?.id !== returnData.sellerId) {
      return res.status(403).json({ error: 'You do not have permission to update this return' });
    }
    
    const { returnStatus, refundStatus } = req.body;
    
    if (!returnStatus) {
      return res.status(400).json({ error: 'Return status is required' });
    }
    
    const updatedReturn = await storage.updateReturnStatus(returnId, returnStatus, refundStatus);
    
    return res.status(200).json(updatedReturn);
  } catch (error) {
    console.error("Error updating return:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}