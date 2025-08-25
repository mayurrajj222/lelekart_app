import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { randomBytes } from "crypto";

// Validate gift card request
const giftCardSchema = z.object({
  initialValue: z.number().min(100),
  senderUserId: z.number().optional(),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().optional(),
  expiryDate: z.date().optional(),
  templateId: z.number().optional(),
  message: z.string().optional(),
});

// Generate a random gift card code
function generateGiftCardCode(): string {
  // Format: XXXX-XXXX-XXXX-XXXX where X is alphanumeric
  const buffer = randomBytes(8);
  const hex = buffer.toString('hex').toUpperCase();
  
  // Format into groups of 4 chars
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

// Get gift cards for the logged-in user
export async function getUserGiftCards(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const giftCards = await storage.getUserGiftCards(userId);
    
    return res.json(giftCards);
  } catch (error) {
    console.error('Error fetching user gift cards:', error);
    return res.status(500).json({ error: 'Failed to fetch gift cards' });
  }
}

// Create a new gift card
export async function createGiftCard(req: Request, res: Response) {
  try {
    // Validate request
    const validatedData = await giftCardSchema.parseAsync(req.body);
    
    // Generate a unique code
    const code = generateGiftCardCode();
    
    // Calculate expiry date (1 year by default if not provided)
    const expiryDate = validatedData.expiryDate || 
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    // Create gift card
    const giftCard = await storage.createGiftCard({
      code,
      initialValue: validatedData.initialValue,
      currentBalance: validatedData.initialValue,
      senderUserId: validatedData.senderUserId || (req.user?.id || null),
      recipientEmail: validatedData.recipientEmail || null,
      recipientName: validatedData.recipientName || null,
      expiryDate,
      status: 'active',
      templateId: validatedData.templateId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // If the gift card is being purchased by a user, associate it with their account
    if (req.user && !validatedData.recipientEmail) {
      // Update the gift card to associate it with the user
      await storage.updateGiftCard(giftCard.id, {
        userId: req.user.id
      });
    }
    
    // TODO: If recipientEmail is provided, send email with gift card details
    
    return res.status(201).json(giftCard);
  } catch (error) {
    console.error('Error creating gift card:', error);
    return res.status(500).json({ error: 'Failed to create gift card' });
  }
}

// Check gift card balance
export async function checkGiftCardBalance(req: Request, res: Response) {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Gift card code is required' });
    }
    
    const giftCard = await storage.getGiftCardByCode(code);
    
    if (!giftCard) {
      return res.status(404).json({ error: 'Gift card not found' });
    }
    
    // Don't return all the gift card details, just the necessary info
    return res.json({
      code: giftCard.code,
      initialValue: giftCard.initialValue,
      currentBalance: giftCard.currentBalance,
      expiryDate: giftCard.expiryDate,
      status: giftCard.status
    });
  } catch (error) {
    console.error('Error checking gift card balance:', error);
    return res.status(500).json({ error: 'Failed to check gift card balance' });
  }
}

// Apply gift card to an order
export async function applyGiftCardToOrder(req: Request, res: Response) {
  try {
    const { code, orderId, amount } = req.body;
    
    if (!code || !orderId || !amount) {
      return res.status(400).json({ 
        error: 'Gift card code, order ID, and amount are required' 
      });
    }
    
    const giftCard = await storage.getGiftCardByCode(code);
    
    if (!giftCard) {
      return res.status(404).json({ error: 'Gift card not found' });
    }
    
    // Check if gift card is valid
    if (giftCard.status !== 'active') {
      return res.status(400).json({ 
        error: `Gift card is ${giftCard.status}` 
      });
    }
    
    // Check if gift card has expired
    if (giftCard.expiryDate && new Date(giftCard.expiryDate) < new Date()) {
      await storage.updateGiftCard(giftCard.id, { status: 'expired' });
      return res.status(400).json({ error: 'Gift card has expired' });
    }
    
    // Check if gift card has sufficient balance
    if (giftCard.currentBalance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance on gift card',
        availableBalance: giftCard.currentBalance
      });
    }
    
    // Update gift card balance
    const newBalance = giftCard.currentBalance - amount;
    const updatedCard = await storage.updateGiftCard(giftCard.id, {
      currentBalance: newBalance,
      status: newBalance === 0 ? 'used' : 'active',
      updatedAt: new Date()
    });
    
    // Create transaction record
    const transaction = await storage.createGiftCardTransaction({
      giftCardId: giftCard.id,
      orderId,
      amount,
      transactionDate: new Date(),
      description: `Applied to order #${orderId}`
    });
    
    return res.json({
      message: 'Gift card applied successfully',
      amountApplied: amount,
      remainingBalance: updatedCard.currentBalance,
      transaction
    });
  } catch (error) {
    console.error('Error applying gift card to order:', error);
    return res.status(500).json({ error: 'Failed to apply gift card' });
  }
}

// Admin handlers
export async function getAllGiftCards(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await storage.getAllGiftCards(page, limit);
    
    return res.json({
      giftCards: result.giftCards,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error) {
    console.error('Error fetching all gift cards:', error);
    return res.status(500).json({ error: 'Failed to fetch gift cards' });
  }
}

export async function getGiftCard(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const giftCard = await storage.getGiftCard(id);
    
    if (!giftCard) {
      return res.status(404).json({ error: 'Gift card not found' });
    }
    
    return res.json(giftCard);
  } catch (error) {
    console.error('Error fetching gift card:', error);
    return res.status(500).json({ error: 'Failed to fetch gift card' });
  }
}

export async function updateGiftCard(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const giftCard = await storage.updateGiftCard(id, {
      ...req.body,
      updatedAt: new Date()
    });
    
    return res.json(giftCard);
  } catch (error) {
    console.error('Error updating gift card:', error);
    return res.status(500).json({ error: 'Failed to update gift card' });
  }
}