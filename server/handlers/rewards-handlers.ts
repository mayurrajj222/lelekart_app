import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Validate user reward points transaction request
const rewardTransactionSchema = z.object({
  userId: z.number(),
  points: z.number(),
  type: z.string(),
  description: z.string().optional(),
  orderId: z.number().optional(),
  productId: z.number().optional(),
});

// Process point award for a purchase
export async function processOrderReward(req: Request, res: Response) {
  try {
    // Validate request
    const result = await z.object({
      orderId: z.number(),
      orderTotal: z.number(),
    }).parseAsync(req.body);
    
    const { orderId, orderTotal } = result;
    const userId = req.user!.id;

    // Get applicable rules for purchase
    const purchaseRules = await storage.getActiveRewardRulesByType('purchase');
    
    // Calculate points to award based on applicable rules
    let pointsToAward = 0;
    let description = '';
    
    for (const rule of purchaseRules) {
      // Skip rules with minimum order value if the order total doesn't meet it
      if (rule.minimumOrderValue && orderTotal < rule.minimumOrderValue) {
        continue;
      }
      
      // Calculate points based on type of rule
      if (rule.percentageValue) {
        // Percentage of order value
        pointsToAward += Math.floor(orderTotal * (rule.percentageValue / 100));
        description = `${pointsToAward} points (${rule.percentageValue}% of order value)`;
      } else {
        // Fixed points amount
        pointsToAward += rule.pointsAwarded;
        description = `${pointsToAward} points for order completion`;
      }
    }
    
    if (pointsToAward <= 0) {
      return res.json({ message: 'No points awarded for this order', pointsAwarded: 0 });
    }

    // Create transaction record
    const transaction = await storage.createRewardTransaction({
      userId,
      points: pointsToAward,
      type: 'purchase',
      description,
      orderId,
      transactionDate: new Date(),
      status: 'active'
    });

    // Update user rewards balance
    let userRewards = await storage.getUserRewards(userId);
    if (!userRewards) {
      userRewards = await storage.createUserRewards({
        userId,
        points: pointsToAward,
        lifetimePoints: pointsToAward,
        lastUpdated: new Date()
      });
    } else {
      userRewards = await storage.updateUserRewards(userId, {
        points: userRewards.points + pointsToAward,
        lifetimePoints: userRewards.lifetimePoints + pointsToAward,
        lastUpdated: new Date()
      });
    }

    return res.json({
      message: 'Points awarded successfully',
      pointsAwarded: pointsToAward,
      transaction,
      rewards: userRewards
    });
  } catch (error) {
    console.error('Error processing reward points for order:', error);
    return res.status(500).json({ error: 'Failed to process reward points' });
  }
}

// Get user rewards data
export async function getUserRewards(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const rewards = await storage.getUserRewards(userId);
    
    if (!rewards) {
      // Create a new rewards record if one doesn't exist
      const newRewards = await storage.createUserRewards({
        userId,
        points: 0,
        lifetimePoints: 0,
        lastUpdated: new Date()
      });
      
      return res.json(newRewards);
    }
    
    return res.json(rewards);
  } catch (error) {
    console.error('Error fetching user rewards:', error);
    return res.status(500).json({ error: 'Failed to fetch rewards data' });
  }
}

// Get user reward transactions
export async function getUserRewardTransactions(req: Request, res: Response) {
    try {
        const userId = req.user!.id;
        const transactions = await storage.getRewardTransactionsByUserId(userId);
        return res.json(transactions);
    } catch (error) {
        console.error('Error fetching user reward transactions:', error);
        return res.status(500).json({ error: 'Failed to fetch reward transactions' });
    }
}

// Get all reward rules
export async function getRewardRules(req: Request, res: Response) {
    try {
        const rules = await storage.getAllRewardRules();
        return res.json(rules);
    } catch (error) {
        console.error('Error fetching reward rules:', error);
        return res.status(500).json({ error: 'Failed to fetch reward rules' });
    }
} 