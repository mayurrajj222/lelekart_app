import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Schemas for validation
const shippingMethodSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  price: z.number().int().min(0),
  estimatedDays: z.string().min(1),
  isActive: z.boolean().default(true),
  icon: z.string().optional(),
  priority: z.number().int().default(0)
});

const shippingZoneSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  regions: z.string().min(1),
  isActive: z.boolean().default(true)
});

const shippingRuleSchema = z.object({
  methodId: z.number().int().positive(),
  zoneId: z.number().int().positive(),
  price: z.number().int().min(0),
  minOrderValue: z.number().int().min(0).default(0),
  maxOrderValue: z.number().int().min(0).optional(),
  minWeight: z.number().int().min(0).default(0),
  maxWeight: z.number().int().min(0).optional(),
  additionalDays: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  isActive: z.boolean().default(true)
});

const sellerShippingSettingsSchema = z.object({
  enableCustomShipping: z.boolean().default(false),
  defaultShippingMethodId: z.number().int().min(1).optional(),
  freeShippingThreshold: z.number().int().min(0).optional(),
  processingTime: z.string().optional(),
  shippingPolicy: z.string().optional(),
  returnPolicy: z.string().optional(),
  internationalShipping: z.boolean().default(false)
});

const productShippingOverrideSchema = z.object({
  productId: z.number().int().positive(),
  customPrice: z.number().int().min(0).optional(),
  freeShipping: z.boolean().default(false),
  additionalProcessingDays: z.number().int().min(0).default(0),
  shippingRestrictions: z.string().optional()
});

const shippingTrackingSchema = z.object({
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  shippedDate: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
  status: z.enum(["pending", "shipped", "delivered", "failed"]).default("pending"),
  notes: z.string().optional()
});

// Shipping Methods API handlers
export async function getShippingMethods(req: Request, res: Response) {
  try {
    const methods = await storage.getShippingMethods();
    res.json(methods);
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    res.status(500).json({ error: "Failed to fetch shipping methods" });
  }
}

export async function getShippingMethod(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid shipping method ID" });
    }

    const method = await storage.getShippingMethodById(id);
    if (!method) {
      return res.status(404).json({ error: "Shipping method not found" });
    }

    res.json(method);
  } catch (error) {
    console.error("Error fetching shipping method:", error);
    res.status(500).json({ error: "Failed to fetch shipping method" });
  }
}

export async function createShippingMethod(req: Request, res: Response) {
  try {
    // Require admin or co-admin role
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!["admin", "co-admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const validationResult = shippingMethodSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid shipping method data", 
        details: validationResult.error.format() 
      });
    }

    const newMethod = await storage.createShippingMethod(validationResult.data);
    res.status(201).json(newMethod);
  } catch (error) {
    console.error("Error creating shipping method:", error);
    res.status(500).json({ error: "Failed to create shipping method" });
  }
}

export async function updateShippingMethod(req: Request, res: Response) {
  try {
    // Require admin or co-admin role
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!["admin", "co-admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid shipping method ID" });
    }

    // Check if method exists
    const existingMethod = await storage.getShippingMethodById(id);
    if (!existingMethod) {
      return res.status(404).json({ error: "Shipping method not found" });
    }

    const validationResult = shippingMethodSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid shipping method data", 
        details: validationResult.error.format() 
      });
    }

    const updatedMethod = await storage.updateShippingMethod(id, validationResult.data);
    res.json(updatedMethod);
  } catch (error) {
    console.error("Error updating shipping method:", error);
    res.status(500).json({ error: "Failed to update shipping method" });
  }
}

export async function deleteShippingMethod(req: Request, res: Response) {
  try {
    // Require admin or co-admin role
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!["admin", "co-admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid shipping method ID" });
    }

    // Check if there are any shipping rules using this method
    const rulesUsingMethod = await storage.getShippingRulesByMethodId(id);
    if (rulesUsingMethod.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete shipping method that is used in shipping rules",
        usedInRules: rulesUsingMethod.length
      });
    }

    await storage.deleteShippingMethod(id);
    res.sendStatus(204);
  } catch (error) {
    console.error("Error deleting shipping method:", error);
    res.status(500).json({ error: "Failed to delete shipping method" });
  }
}

// Shipping Zones API handlers
export async function getShippingZones(req: Request, res: Response) {
  try {
    const zones = await storage.getShippingZones();
    res.json(zones);
  } catch (error) {
    console.error("Error fetching shipping zones:", error);
    res.status(500).json({ error: "Failed to fetch shipping zones" });
  }
}

export async function getShippingZone(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid shipping zone ID" });
    }

    const zone = await storage.getShippingZoneById(id);
    if (!zone) {
      return res.status(404).json({ error: "Shipping zone not found" });
    }

    res.json(zone);
  } catch (error) {
    console.error("Error fetching shipping zone:", error);
    res.status(500).json({ error: "Failed to fetch shipping zone" });
  }
}

export async function createShippingZone(req: Request, res: Response) {
  try {
    // Require admin or co-admin role
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!["admin", "co-admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const validationResult = shippingZoneSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid shipping zone data", 
        details: validationResult.error.format() 
      });
    }

    const newZone = await storage.createShippingZone(validationResult.data);
    res.status(201).json(newZone);
  } catch (error) {
    console.error("Error creating shipping zone:", error);
    res.status(500).json({ error: "Failed to create shipping zone" });
  }
}

export async function updateShippingZone(req: Request, res: Response) {
  try {
    // Require admin or co-admin role
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!["admin", "co-admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid shipping zone ID" });
    }

    // Check if zone exists
    const existingZone = await storage.getShippingZoneById(id);
    if (!existingZone) {
      return res.status(404).json({ error: "Shipping zone not found" });
    }

    const validationResult = shippingZoneSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid shipping zone data", 
        details: validationResult.error.format() 
      });
    }

    const updatedZone = await storage.updateShippingZone(id, validationResult.data);
    res.json(updatedZone);
  } catch (error) {
    console.error("Error updating shipping zone:", error);
    res.status(500).json({ error: "Failed to update shipping zone" });
  }
}

export async function deleteShippingZone(req: Request, res: Response) {
  try {
    // Require admin or co-admin role
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!["admin", "co-admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid shipping zone ID" });
    }

    // Check if there are any shipping rules using this zone
    const rulesUsingZone = await storage.getShippingRulesByZoneId(id);
    if (rulesUsingZone.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete shipping zone that is used in shipping rules",
        usedInRules: rulesUsingZone.length
      });
    }

    await storage.deleteShippingZone(id);
    res.sendStatus(204);
  } catch (error) {
    console.error("Error deleting shipping zone:", error);
    res.status(500).json({ error: "Failed to delete shipping zone" });
  }
}

// Shipping Rules API handlers
export async function getShippingRules(req: Request, res: Response) {
  try {
    const rules = await storage.getShippingRules();
    res.json(rules);
  } catch (error) {
    console.error("Error fetching shipping rules:", error);
    res.status(500).json({ error: "Failed to fetch shipping rules" });
  }
}

export async function getShippingRule(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid shipping rule ID" });
    }

    const rule = await storage.getShippingRuleById(id);
    if (!rule) {
      return res.status(404).json({ error: "Shipping rule not found" });
    }

    res.json(rule);
  } catch (error) {
    console.error("Error fetching shipping rule:", error);
    res.status(500).json({ error: "Failed to fetch shipping rule" });
  }
}

export async function createShippingRule(req: Request, res: Response) {
  try {
    // Require admin or co-admin role
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!["admin", "co-admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const validationResult = shippingRuleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid shipping rule data", 
        details: validationResult.error.format() 
      });
    }

    // Check if the method and zone exist
    const method = await storage.getShippingMethodById(validationResult.data.methodId);
    if (!method) {
      return res.status(400).json({ error: "Shipping method not found" });
    }

    const zone = await storage.getShippingZoneById(validationResult.data.zoneId);
    if (!zone) {
      return res.status(400).json({ error: "Shipping zone not found" });
    }

    // Check for duplicate rules with the same method and zone
    const existingRules = await storage.getShippingRulesByMethodAndZone(
      validationResult.data.methodId, 
      validationResult.data.zoneId
    );
    
    // Check for overlapping order value ranges
    if (existingRules.length > 0) {
      const newMinValue = validationResult.data.minOrderValue || 0;
      const newMaxValue = validationResult.data.maxOrderValue;
      
      const overlap = existingRules.some(rule => {
        const existingMinValue = rule.minOrderValue || 0;
        const existingMaxValue = rule.maxOrderValue;
        
        // Check if ranges overlap
        if (newMaxValue === undefined && existingMaxValue === undefined) {
          // Both rules apply to all order values above their minimum
          return true;
        } else if (newMaxValue === undefined) {
          // New rule applies to all order values above its minimum
          return existingMinValue <= newMinValue || (existingMaxValue !== undefined && existingMaxValue > newMinValue);
        } else if (existingMaxValue === undefined) {
          // Existing rule applies to all order values above its minimum
          return newMinValue <= existingMinValue || newMaxValue > existingMinValue;
        } else {
          // Both rules have defined ranges
          return (newMinValue <= existingMaxValue && existingMinValue <= newMaxValue);
        }
      });
      
      if (overlap) {
        return res.status(400).json({ 
          error: "Shipping rule overlaps with an existing rule for the same method and zone"
        });
      }
    }

    const newRule = await storage.createShippingRule(validationResult.data);
    res.status(201).json(newRule);
  } catch (error) {
    console.error("Error creating shipping rule:", error);
    res.status(500).json({ error: "Failed to create shipping rule" });
  }
}

export async function updateShippingRule(req: Request, res: Response) {
  try {
    // Require admin or co-admin role
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!["admin", "co-admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid shipping rule ID" });
    }

    // Check if rule exists
    const existingRule = await storage.getShippingRuleById(id);
    if (!existingRule) {
      return res.status(404).json({ error: "Shipping rule not found" });
    }

    const validationResult = shippingRuleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid shipping rule data", 
        details: validationResult.error.format() 
      });
    }

    // Check if the method and zone exist
    const method = await storage.getShippingMethodById(validationResult.data.methodId);
    if (!method) {
      return res.status(400).json({ error: "Shipping method not found" });
    }

    const zone = await storage.getShippingZoneById(validationResult.data.zoneId);
    if (!zone) {
      return res.status(400).json({ error: "Shipping zone not found" });
    }

    // Check for overlapping rules (excluding this rule)
    if (validationResult.data.methodId !== existingRule.methodId || 
        validationResult.data.zoneId !== existingRule.zoneId ||
        validationResult.data.minOrderValue !== existingRule.minOrderValue ||
        validationResult.data.maxOrderValue !== existingRule.maxOrderValue) {
      
      const existingRules = await storage.getShippingRulesByMethodAndZone(
        validationResult.data.methodId, 
        validationResult.data.zoneId
      );
      
      const newMinValue = validationResult.data.minOrderValue || 0;
      const newMaxValue = validationResult.data.maxOrderValue;
      
      const overlap = existingRules.some(rule => {
        // Skip the current rule being updated
        if (rule.id === id) return false;
        
        const existingMinValue = rule.minOrderValue || 0;
        const existingMaxValue = rule.maxOrderValue;
        
        // Check if ranges overlap
        if (newMaxValue === undefined && existingMaxValue === undefined) {
          // Both rules apply to all order values above their minimum
          return true;
        } else if (newMaxValue === undefined) {
          // New rule applies to all order values above its minimum
          return existingMinValue <= newMinValue || (existingMaxValue !== undefined && existingMaxValue > newMinValue);
        } else if (existingMaxValue === undefined) {
          // Existing rule applies to all order values above its minimum
          return newMinValue <= existingMinValue || newMaxValue > existingMinValue;
        } else {
          // Both rules have defined ranges
          return (newMinValue <= existingMaxValue && existingMinValue <= newMaxValue);
        }
      });
      
      if (overlap) {
        return res.status(400).json({ 
          error: "Updated shipping rule would overlap with an existing rule for the same method and zone"
        });
      }
    }

    const updatedRule = await storage.updateShippingRule(id, validationResult.data);
    res.json(updatedRule);
  } catch (error) {
    console.error("Error updating shipping rule:", error);
    res.status(500).json({ error: "Failed to update shipping rule" });
  }
}

export async function deleteShippingRule(req: Request, res: Response) {
  try {
    // Require admin or co-admin role
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!["admin", "co-admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid shipping rule ID" });
    }

    await storage.deleteShippingRule(id);
    res.sendStatus(204);
  } catch (error) {
    console.error("Error deleting shipping rule:", error);
    res.status(500).json({ error: "Failed to delete shipping rule" });
  }
}

// Seller Shipping Settings API handlers
export async function getSellerShippingSettings(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") {
      return res.status(403).json({ error: "Not a seller account" });
    }

    const settings = await storage.getSellerShippingSettings(req.user.id);
    res.json(settings || {
      sellerId: req.user.id,
      enableCustomShipping: false,
      defaultShippingMethodId: null,
      freeShippingThreshold: null,
      processingTime: "1-2 business days",
      shippingPolicy: "",
      returnPolicy: "",
      internationalShipping: false
    });
  } catch (error) {
    console.error("Error fetching seller shipping settings:", error);
    res.status(500).json({ error: "Failed to fetch shipping settings" });
  }
}

export async function createOrUpdateSellerShippingSettings(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") {
      return res.status(403).json({ error: "Not a seller account" });
    }

    const validationResult = sellerShippingSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid shipping settings data", 
        details: validationResult.error.format() 
      });
    }

    // If a default shipping method is specified, check if it exists
    if (validationResult.data.defaultShippingMethodId) {
      const method = await storage.getShippingMethodById(validationResult.data.defaultShippingMethodId);
      if (!method) {
        return res.status(400).json({ error: "Default shipping method not found" });
      }
    }

    const settings = await storage.updateSellerShippingSettings(req.user.id, validationResult.data);
    res.json(settings);
  } catch (error) {
    console.error("Error updating seller shipping settings:", error);
    res.status(500).json({ error: "Failed to update shipping settings" });
  }
}

// Product Shipping Overrides API handlers
export async function getProductShippingOverrides(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") {
      return res.status(403).json({ error: "Not a seller account" });
    }

    const overrides = await storage.getProductShippingOverrides(req.user.id);
    res.json(overrides);
  } catch (error) {
    console.error("Error fetching product shipping overrides:", error);
    res.status(500).json({ error: "Failed to fetch product shipping overrides" });
  }
}

export async function getProductShippingOverride(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Get the product to check ownership
    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check authorization - seller can only access their own products
    if (req.user.role === "seller" && product.sellerId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to access this product" });
    }

    const override = await storage.getProductShippingOverride(productId);
    if (!override) {
      return res.status(404).json({ error: "Product shipping override not found" });
    }

    res.json(override);
  } catch (error) {
    console.error("Error fetching product shipping override:", error);
    res.status(500).json({ error: "Failed to fetch product shipping override" });
  }
}

export async function createOrUpdateProductShippingOverride(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") {
      return res.status(403).json({ error: "Not a seller account" });
    }

    const validationResult = productShippingOverrideSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid product shipping override data", 
        details: validationResult.error.format() 
      });
    }

    // Check if the product exists and belongs to this seller
    const product = await storage.getProduct(validationResult.data.productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.sellerId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to modify this product" });
    }

    // Check if an override already exists
    const existingOverride = await storage.getProductShippingOverrideByProduct(validationResult.data.productId);
    
    let override;
    if (existingOverride) {
      // Update existing override
      override = await storage.updateProductShippingOverride(existingOverride.id, validationResult.data);
    } else {
      // Create new override
      override = await storage.createProductShippingOverride({
        ...validationResult.data,
        sellerId: req.user.id
      });
    }
    
    res.json(override);
  } catch (error) {
    console.error("Error creating/updating product shipping override:", error);
    res.status(500).json({ error: "Failed to create/update product shipping override" });
  }
}

export async function deleteProductShippingOverride(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller") {
      return res.status(403).json({ error: "Not a seller account" });
    }

    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Check if the product exists and belongs to this seller
    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.sellerId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to modify this product" });
    }

    // First get the override to get its ID
    const override = await storage.getProductShippingOverrideByProduct(productId);
    if (!override) {
      return res.status(404).json({ error: "Product shipping override not found" });
    }
    
    await storage.deleteProductShippingOverride(override.id);
    res.sendStatus(204);
  } catch (error) {
    console.error("Error deleting product shipping override:", error);
    res.status(500).json({ error: "Failed to delete product shipping override" });
  }
}

// Order Shipping Tracking API handlers
export async function getOrderShippingTracking(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Get the order
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check authorization - buyer can see their own orders, seller can see orders for their products
    if (req.user.role === "buyer" && order.buyerId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to access this order" });
    } 
    
    if (req.user.role === "seller") {
      // Check if any product in the order belongs to this seller
      const orderItems = await storage.getOrderItems(orderId);
      const sellerProducts = await storage.getProductsBySeller(req.user.id);
      const sellerProductIds = sellerProducts.map(p => p.id);
      
      const hasSellerProduct = orderItems.some(item => 
        sellerProductIds.includes(item.productId)
      );
      
      if (!hasSellerProduct) {
        return res.status(403).json({ error: "Not authorized to access this order" });
      }
    }

    const tracking = await storage.getShippingTracking(orderId);
    if (!tracking) {
      return res.status(404).json({ error: "Order shipping tracking not found" });
    }

    res.json(tracking);
  } catch (error) {
    console.error("Error fetching order shipping tracking:", error);
    res.status(500).json({ error: "Failed to fetch order shipping tracking" });
  }
}

export async function createOrUpdateOrderShippingTracking(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "seller" && !["admin", "co-admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const validationResult = shippingTrackingSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid shipping tracking data", 
        details: validationResult.error.format() 
      });
    }

    // Get the order
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If seller, check if any product in the order belongs to this seller
    if (req.user.role === "seller") {
      const orderItems = await storage.getOrderItems(orderId);
      const sellerProducts = await storage.getProductsBySeller(req.user.id);
      const sellerProductIds = sellerProducts.map(p => p.id);
      
      const hasSellerProduct = orderItems.some(item => 
        sellerProductIds.includes(item.productId)
      );
      
      if (!hasSellerProduct) {
        return res.status(403).json({ error: "Not authorized to update this order's tracking" });
      }
    }

    // Check if tracking already exists
    const existingTracking = await storage.getShippingTracking(orderId);
    
    let tracking;
    if (existingTracking) {
      // Update existing tracking
      tracking = await storage.updateShippingTracking(existingTracking.id, validationResult.data);
    } else {
      // Create new tracking
      tracking = await storage.createShippingTracking({
        ...validationResult.data,
        orderId,
        status: validationResult.data.status || "Pending",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    res.json(tracking);
  } catch (error) {
    console.error("Error creating/updating order shipping tracking:", error);
    res.status(500).json({ error: "Failed to create/update order shipping tracking" });
  }
}