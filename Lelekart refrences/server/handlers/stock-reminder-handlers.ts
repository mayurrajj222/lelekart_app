import { Request, Response } from "express";
import { storage } from "../storage";
import { sendNotificationToUser } from "../websocket";
import * as emailService from "../services/email-service";

/**
 * Create a stock reminder for a product
 */
export async function createStockReminderHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { productId, variantId, email } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    if (!productId || !email) {
      res.status(400).json({ error: "Product ID and email are required" });
      return;
    }

    // Check if product exists
    const product = await storage.getProduct(productId);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    // Check if variant exists (if provided)
    if (variantId) {
      const variant = await storage.getProductVariant(variantId);
      if (!variant) {
        res.status(404).json({ error: "Product variant not found" });
        return;
      }
    }

    // Check if user already has a reminder for this product/variant
    const existingReminder = await storage.checkExistingStockReminder(
      userId,
      productId,
      variantId
    );

    if (existingReminder) {
      res.status(409).json({
        error: "You already have a stock reminder for this product",
        reminderId: existingReminder.id,
      });
      return;
    }

    // Create the stock reminder
    const reminder = await storage.createStockReminder({
      userId,
      productId,
      variantId: variantId || null,
      email,
      notified: false,
    });

    // Send notification to seller about stock reminder request
    if (product.sellerId) {
      try {
        const buyer = await storage.getUser(userId);
        const seller = await storage.getUser(product.sellerId);

        if (buyer && seller) {
          // Send in-app notification to seller
          await storage.createNotification({
            userId: product.sellerId,
            type: "STOCK_AVAILABLE",
            title: "Stock Reminder Request",
            message: `${buyer.name || buyer.username} wants to be notified when ${product.name} is back in stock`,
            link: `/seller/products/${product.id}`,
            read: false,
            metadata: JSON.stringify({
              productId: product.id,
              productName: product.name,
              buyerId: userId,
              buyerName: buyer.name || buyer.username,
              reminderId: reminder.id,
            }),
          });

          // Send real-time notification to seller
          await sendNotificationToUser(product.sellerId, {
            type: "STOCK_AVAILABLE",
            title: "Stock Reminder Request",
            message: `${buyer.name || buyer.username} wants to be notified when ${product.name} is back in stock`,
            link: `/seller/products/${product.id}`,
            read: false,
            metadata: JSON.stringify({
              productId: product.id,
              productName: product.name,
              buyerId: userId,
              buyerName: buyer.name || buyer.username,
              reminderId: reminder.id,
            }),
          });

          console.log(
            `Sent stock reminder notification to seller ${product.sellerId} for product ${product.id}`
          );
        }
      } catch (error) {
        console.error("Error sending notification to seller:", error);
        // Don't fail the reminder creation if seller notification fails
      }
    }

    res.status(201).json({
      message: "Stock reminder created successfully",
      reminder,
    });
  } catch (error) {
    console.error("Error creating stock reminder:", error);
    res.status(500).json({ error: "Failed to create stock reminder" });
  }
}

/**
 * Get user's stock reminders
 */
export async function getUserStockRemindersHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const reminders = await storage.getUserStockReminders(userId);

    // Get product details for each reminder
    const remindersWithProducts = await Promise.all(
      reminders.map(async (reminder) => {
        const product = await storage.getProduct(reminder.productId);
        let variant = null;

        if (reminder.variantId) {
          variant = await storage.getProductVariant(reminder.variantId);
        }

        return {
          ...reminder,
          product,
          variant,
        };
      })
    );

    res.status(200).json(remindersWithProducts);
  } catch (error) {
    console.error("Error getting user stock reminders:", error);
    res.status(500).json({ error: "Failed to get stock reminders" });
  }
}

/**
 * Delete a stock reminder
 */
export async function deleteStockReminderHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const reminderId = parseInt(id);
    if (isNaN(reminderId)) {
      res.status(400).json({ error: "Invalid reminder ID" });
      return;
    }

    // Get the reminder to check ownership
    const reminder = await storage.getStockReminder(reminderId);
    if (!reminder) {
      res.status(404).json({ error: "Stock reminder not found" });
      return;
    }

    if (reminder.userId !== userId) {
      res.status(403).json({ error: "Not authorized to delete this reminder" });
      return;
    }

    await storage.deleteStockReminder(reminderId);

    res.status(200).json({ message: "Stock reminder deleted successfully" });
  } catch (error) {
    console.error("Error deleting stock reminder:", error);
    res.status(500).json({ error: "Failed to delete stock reminder" });
  }
}

/**
 * Process stock reminders when product stock becomes available
 * This function should be called when product stock is updated
 */
export async function processStockRemindersForProduct(
  productId: number,
  variantId?: number
): Promise<void> {
  try {
    console.log(
      `Processing stock reminders for product ${productId}${variantId ? ` variant ${variantId}` : ""}`
    );

    // Get all pending reminders for this product
    const allReminders = await storage.getStockRemindersByProduct(productId);

    // Filter reminders based on variant
    const relevantReminders = allReminders.filter((reminder) => {
      if (variantId) {
        // If we're updating a specific variant, only notify reminders for that variant
        return reminder.variantId === variantId && !reminder.notified;
      } else {
        // If we're updating main product stock, only notify reminders for main product (no variant)
        return !reminder.variantId && !reminder.notified;
      }
    });

    console.log(
      `Found ${relevantReminders.length} relevant stock reminders to process`
    );

    // Process each reminder
    for (const reminder of relevantReminders) {
      try {
        // Get product and user details
        const product = await storage.getProduct(reminder.productId);
        const user = await storage.getUser(reminder.userId);

        if (!product || !user) {
          console.error(`Missing product or user for reminder ${reminder.id}`);
          continue;
        }

        // Mark reminder as notified
        await storage.markStockReminderAsNotified(reminder.id);

        // Send in-app notification
        await storage.createNotification({
          userId: reminder.userId,
          type: "STOCK_AVAILABLE",
          title: "Product Back in Stock!",
          message: `${product.name} is now back in stock!`,
          link: `/product/${product.id}`,
          read: false,
          metadata: JSON.stringify({
            productId: product.id,
            productName: product.name,
            reminderId: reminder.id,
          }),
        });

        // Send real-time notification
        await sendNotificationToUser(reminder.userId, {
          type: "STOCK_AVAILABLE",
          title: "Product Back in Stock!",
          message: `${product.name} is now back in stock!`,
          link: `/product/${product.id}`,
          read: false,
          metadata: JSON.stringify({
            productId: product.id,
            productName: product.name,
            reminderId: reminder.id,
          }),
        });

        // Send email notification
        if (reminder.email) {
          await emailService.sendStockAvailableEmail(
            reminder.email,
            user.name || user.username,
            product.name,
            product.id
          );
        }

        console.log(
          `Successfully processed stock reminder ${reminder.id} for user ${reminder.userId}`
        );
      } catch (error) {
        console.error(`Error processing stock reminder ${reminder.id}:`, error);
        // Continue processing other reminders even if one fails
      }
    }
  } catch (error) {
    console.error("Error processing stock reminders:", error);
  }
}
