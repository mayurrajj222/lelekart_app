/**
 * Return Management Routes
 * 
 * This file contains all the API routes for the return management system.
 */

import { Router } from "express";
import { storage } from "../storage";
import * as returnHandlers from "../handlers/return-handlers";
import { checkReturnEligibility } from "../services/return-eligibility";
import { handleOrderStatusChange } from '../handlers/order-status-handler';

const router = Router();

// Base route handler for /api/returns
router.get("/", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const user = req.user;
    
    // If user is a buyer, get buyer returns
    if (user.role === "buyer") {
      const limitStr = req.query.limit ? String(req.query.limit) : "10";
      const offsetStr = req.query.offset ? String(req.query.offset) : "0";
      
      // 1. Get return requests with status marked_for_return
      const returnRequests = await storage.getReturnRequestsByBuyerId(
        user.id,
        parseInt(limitStr),
        parseInt(offsetStr)
      );
      const markedReturnRequests = returnRequests.filter(r => r.status === 'marked_for_return');

      // 2. Get all orders with status marked_for_return for this user
      const allOrders = await storage.getOrders(user.id);
      const markedOrders = allOrders.filter(o => o.status === 'marked_for_return');

      // 3. For each marked order, check if a return request exists, if not, add a pseudo-return-request object
      const orderIdsWithReturnRequest = new Set(markedReturnRequests.map(r => r.orderId));
      const pseudoReturnRequests = markedOrders
        .filter(o => !orderIdsWithReturnRequest.has(o.id))
        .map(o => ({
          id: `order-${o.id}`,
          orderId: o.id,
          orderNumber: String(o.id),
          requestType: 'return',
          status: 'marked_for_return',
          createdAt: o.date,
          updatedAt: o.date,
          isOrderOnly: true // flag to distinguish
        }));

      // 4. Merge and return
      const combined = [...markedReturnRequests, ...pseudoReturnRequests];
      return res.json(combined);
    } 
    // If user is a seller, get seller returns
    else if (user.role === "seller") {
      console.log(`Fetching returns for seller: ${user.id}`);
      const limitStr = req.query.limit ? String(req.query.limit) : "10";
      const offsetStr = req.query.offset ? String(req.query.offset) : "0";
      
      const returns = await storage.getReturnRequestsBySellerId(
        user.id,
        parseInt(limitStr),
        parseInt(offsetStr)
      );
      
      return res.json(returns || []);
    }
    // If user is an admin, get all returns with optional filters
    else if (user.role === "admin" || (user.isCoAdmin === true)) {
      console.log(`Fetching returns for admin: ${user.id}`);
      // 1. Get all return requests with status marked_for_return
      const returnRequests = await storage.getReturnRequests({ status: 'marked_for_return' });
      // 2. Get all orders with status marked_for_return
      const markedOrders = await storage.getOrdersMarkedForReturn();
      // 3. For each marked order, check if a return request exists, if not, add a pseudo-return-request object
      const orderIdsWithReturnRequest = new Set(returnRequests.map(r => r.orderId));
      const pseudoReturnRequests = markedOrders
        .filter(o => !orderIdsWithReturnRequest.has(o.id))
        .map(o => ({
          id: `order-${o.id}`,
          orderId: o.id,
          orderNumber: String(o.id),
          requestType: 'return',
          status: 'marked_for_return',
          createdAt: o.date,
          updatedAt: o.date,
          isOrderOnly: true // flag to distinguish
        }));
      // 4. Merge and return
      const combined = [...returnRequests, ...pseudoReturnRequests];
      return res.json(combined);
    }
    
    // If user role is not recognized
    return res.status(403).json({ error: "Access denied" });
  } catch (error) {
    const err = error as Error;
    console.error("Error getting return requests:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to get return requests" });
  }
});

// Check return eligibility
router.get("/check-eligibility/:orderId/:orderItemId", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const orderId = parseInt(req.params.orderId);
    const orderItemId = parseInt(req.params.orderItemId);
    const { requestType } = req.query;
    
    if (isNaN(orderId) || isNaN(orderItemId) || !requestType) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Check eligibility
    const eligibility = await checkReturnEligibility(
      orderId, 
      orderItemId, 
      requestType as string
    );
    
    return res.json(eligibility);
  } catch (error) {
    const err = error as Error;
    console.error("Error checking return eligibility:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to check return eligibility" });
  }
});

// Get active return reasons
router.get("/reasons", async (req, res) => {
  try {
    const { type } = req.query;
    
    let reasons;
    if (type) {
      reasons = await storage.getActiveReturnReasons(type as string);
    } else {
      reasons = await storage.getActiveReturnReasons();
    }
    
    return res.json(reasons || []);
  } catch (error) {
    const err = error as Error;
    console.error("Error getting return reasons:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to get return reasons" });
  }
});

// Create a return request
router.post("/request", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const { 
      orderId, 
      orderItemId, 
      requestType, 
      reasonId, 
      description,
      mediaUrls
    } = req.body;
    
    if (!orderId || !orderItemId || !requestType || !reasonId || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Create return request
    const returnRequest = await returnHandlers.createReturnRequest(
      req.user.id,
      orderId,
      orderItemId,
      requestType,
      reasonId,
      description,
      mediaUrls
    );
    
    return res.status(201).json(returnRequest);
  } catch (error) {
    const err = error as Error;
    console.error("Error creating return request:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to create return request" });
  }
});

// Get return requests for buyer
router.get("/buyer", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const { limit = 10, offset = 0 } = req.query;
    
    // Get return requests
    const returns = await storage.getReturnRequestsByBuyerId(
      req.user.id, 
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    return res.json(returns);
  } catch (error) {
    const err = error as Error;
    console.error("Error getting buyer return requests:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to get buyer return requests" });
  }
});

// Get return requests for seller
router.get("/seller", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Check if user is a seller
    if (req.user.role !== "seller" && req.user.role !== "admin" && !req.user.isCoAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { limit = 10, offset = 0 } = req.query;
    
    // Get return requests
    const returns = await storage.getReturnRequestsBySellerId(
      req.user.id, 
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    return res.json(returns);
  } catch (error) {
    console.error("Error getting seller return requests:", error);
    return res.status(500).json({ error: "Failed to get return requests" });
  }
});

// Get all return requests (admin only)
router.get("/admin", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    // Check if user is admin or co-admin
    if (req.user.role !== "admin" && !req.user.isCoAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    const { 
      limit = 10, 
      offset = 0,
      status,
      sellerId,
      buyerId
    } = req.query;
    // Create filters
    const filters: any = {};
    if (status) filters.status = status;
    if (sellerId) filters.sellerId = parseInt(sellerId as string);
    if (buyerId) filters.buyerId = parseInt(buyerId as string);
    // Get real return requests
    const returns = await storage.getReturnRequests(
      filters,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    // Get all orders with status marked_for_return
    const markedOrders = await storage.getOrdersMarkedForReturn();
    // Get all orderIds that already have a return request
    const orderIdsWithReturnRequest = new Set(returns.map(r => r.orderId));
    // Create pseudo return requests for orders without a return request
    const pseudoReturnRequests = markedOrders
      .filter(o => !orderIdsWithReturnRequest.has(o.id))
      .map(o => ({
        id: `order-${o.id}`,
        orderId: o.id,
        orderNumber: String(o.id),
        requestType: 'return',
        status: 'marked_for_return',
        createdAt: o.date,
        updatedAt: o.date,
        isOrderOnly: true // flag to distinguish
      }));
    // Merge and return
    const combined = [...returns, ...pseudoReturnRequests];
    return res.json(combined);
  } catch (error) {
    console.error("Error getting all return requests:", error);
    return res.status(500).json({ error: "Failed to get return requests" });
  }
});

// Get return request details
router.get("/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    
    if (isNaN(returnId)) {
      return res.status(400).json({ error: "Invalid return ID" });
    }
    
    // Get the return request details
    const returnRequest = await returnHandlers.getReturnRequest(returnId, req.user.id);
    
    if (!returnRequest) {
      return res.status(404).json({ error: "Return request not found" });
    }
    
    // Check if user is authorized to view this return
    const user = req.user;
    const isAuthorized = 
      returnRequest.buyerId === user.id || 
      returnRequest.sellerId === user.id || 
      user.role === "admin" || 
      user.isCoAdmin;
    
    if (!isAuthorized) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    return res.json(returnRequest);
  } catch (error) {
    const err = error as Error;
    console.error("Error getting return request:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to get return request" });
  }
});

// Get return messages
router.get("/:id/messages", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    
    if (isNaN(returnId)) {
      return res.status(400).json({ error: "Invalid return ID" });
    }
    
    // Get the return request to check authorization
    const returnRequest = await storage.getReturnRequestById(returnId);
    
    if (!returnRequest) {
      return res.status(404).json({ error: "Return request not found" });
    }
    
    // Check if user is authorized to view this return's messages
    const user = req.user;
    const isAuthorized = 
      returnRequest.buyerId === user.id || 
      returnRequest.sellerId === user.id || 
      user.role === "admin" || 
      user.isCoAdmin;
    
    if (!isAuthorized) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Get messages
    const messages = await returnHandlers.getReturnMessages(returnId, user.id);
    
    return res.json(messages);
  } catch (error) {
    const err = error as Error;
    console.error("Error getting return messages:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to get return messages" });
  }
});

// Add return message
router.post("/:id/messages", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    const { message, mediaUrls } = req.body;
    
    if (isNaN(returnId) || !message) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Get the return request to check authorization
    const returnRequest = await storage.getReturnRequestById(returnId);
    
    if (!returnRequest) {
      return res.status(404).json({ error: "Return request not found" });
    }
    
    // Check if user is authorized to add messages to this return
    const user = req.user;
    const isAuthorized = 
      returnRequest.buyerId === user.id || 
      returnRequest.sellerId === user.id || 
      user.role === "admin" || 
      user.isCoAdmin;
    
    if (!isAuthorized) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Add message
    const newMessage = await returnHandlers.addReturnMessage(
      returnId,
      user.id,
      message,
      mediaUrls
    );
    
    return res.status(201).json(newMessage);
  } catch (error) {
    const err = error as Error;
    console.error("Error adding return message:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to add return message" });
  }
});

// Cancel return request
router.post("/:id/cancel", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    const { reason } = req.body;
    
    if (isNaN(returnId) || !reason) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Cancel the return
    const updatedReturn = await returnHandlers.cancelReturnRequest(
      returnId,
      req.user.id,
      reason
    );
    
    return res.json(updatedReturn);
  } catch (error) {
    const err = error as Error;
    console.error("Error cancelling return request:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to cancel return request" });
  }
});

// Update return status (seller or admin only)
router.post("/:id/status", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    const { status, notes } = req.body;
    
    if (isNaN(returnId) || !status) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Update the status
    const updatedReturn = await returnHandlers.updateReturnRequestStatus(
      returnId,
      req.user.id,
      status,
      notes
    );
    
    return res.json(updatedReturn);
  } catch (error) {
    const err = error as Error;
    console.error("Error updating return status:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to update return status" });
  }
});

// Add return tracking (buyer or admin only)
router.post("/:id/return-tracking", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    const trackingInfo = req.body;
    
    if (isNaN(returnId) || !trackingInfo) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Add tracking info
    const updatedReturn = await returnHandlers.updateReturnTracking(
      returnId,
      req.user.id,
      trackingInfo
    );
    
    return res.json(updatedReturn);
  } catch (error) {
    const err = error as Error;
    console.error("Error adding return tracking:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to add return tracking" });
  }
});

// Add replacement tracking (seller or admin only)
router.post("/:id/replacement-tracking", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    const trackingInfo = req.body;
    
    if (isNaN(returnId) || !trackingInfo) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Add tracking info
    const updatedReturn = await returnHandlers.updateReplacementTracking(
      returnId,
      req.user.id,
      trackingInfo
    );
    
    return res.json(updatedReturn);
  } catch (error) {
    const err = error as Error;
    console.error("Error adding replacement tracking:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to add replacement tracking" });
  }
});

// Mark return as received (seller or admin only)
router.post("/:id/mark-received", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    const { condition, notes } = req.body;
    
    if (isNaN(returnId) || !condition) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    // Mark as received
    const updatedReturn = await returnHandlers.markReturnReceived(
      returnId,
      req.user.id,
      condition,
      notes
    );
    
    return res.json(updatedReturn);
  } catch (error) {
    const err = error as Error;
    console.error("Error marking return as received:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to mark return as received" });
  }
});

// Complete return request (seller or admin only)
router.post("/:id/complete", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const returnId = parseInt(req.params.id);
    
    if (isNaN(returnId)) {
      return res.status(400).json({ error: "Invalid return ID" });
    }
    
    // Complete the return
    const updatedReturn = await returnHandlers.completeReturnRequest(
      returnId,
      req.user.id
    );
    
    return res.json(updatedReturn);
  } catch (error) {
    const err = error as Error;
    console.error("Error completing return request:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to complete return request" });
  }
});

// Return policies routes (admin or seller only)

// Get return policies for seller
router.get("/policies/seller", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Only sellers or admins can view policies
    if (req.user.role !== "seller" && req.user.role !== "admin" && !req.user.isCoAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const policies = await storage.getReturnPoliciesBySellerId(req.user.id);
    return res.json(policies);
  } catch (error) {
    const err = error as Error;
    console.error("Error getting seller return policies:", err.message || err);
    return res.status(500).json({ error: "Failed to get return policies" });
  }
});

// Create policy
router.post("/policies", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Only admins can create global policies or policies for other sellers
    const isAdmin = req.user.role === "admin" || req.user.isCoAdmin;
    
    // If the user is not an admin, they can only create policies for themselves
    if (!isAdmin && req.body.sellerId && req.body.sellerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Create the policy
    const policy = await storage.createReturnPolicy({
      ...req.body,
      // If seller is creating policy for themselves, make sure sellerId is correct
      sellerId: isAdmin ? req.body.sellerId : req.user.id
    });
    
    return res.status(201).json(policy);
  } catch (error) {
    const err = error as Error;
    console.error("Error creating return policy:", err.message || err);
    return res.status(500).json({ error: "Failed to create return policy" });
  }
});

// Update policy
router.put("/policies/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const policyId = parseInt(req.params.id);
    
    if (isNaN(policyId)) {
      return res.status(400).json({ error: "Invalid policy ID" });
    }
    
    // Get the policy to check ownership
    const policy = await storage.getReturnPolicyById(policyId);
    
    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }
    
    // Check authorization
    const isAdmin = req.user.role === "admin" || req.user.isCoAdmin;
    const isSeller = req.user.role === "seller";
    const isSellerOwner = isSeller && policy.sellerId === req.user.id;
    
    // Only admins can update global policies or policies for other sellers
    if (!isAdmin && !isSellerOwner) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Update the policy
    const updatedPolicy = await storage.updateReturnPolicy(
      policyId,
      req.body
    );
    
    return res.json(updatedPolicy);
  } catch (error) {
    const err = error as Error;
    console.error("Error updating return policy:", err.message || err);
    return res.status(500).json({ error: "Failed to update return policy" });
  }
});

router.post('/orders/:orderId/mark-for-return', async (req, res) => {
  console.log('HIT /orders/:orderId/mark-for-return', { orderId: req.params.orderId, userId: req.user && req.user.id });
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid orderId' });
    }
    // Only buyers can mark for return
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can mark orders for return' });
    }
    console.log('Calling handleOrderStatusChange for order', orderId);
    // 1. Update order status
    const updatedOrder = await handleOrderStatusChange(orderId, 'marked_for_return');
    console.log('handleOrderStatusChange finished for order', orderId, 'status now', updatedOrder.status);
    // 2. Create return requests for each order item (if not already present)
    const orderItems = await storage.getOrderItems(orderId);
    // Use a default reasonId (e.g., 1) and description
    const defaultReasonId = 1;
    const defaultDescription = 'Return requested by buyer from order page.';
    const createdReturnRequests = [];
    for (const item of orderItems) {
      // Check if a return request already exists for this item
      const existingRequests = await storage.getReturnRequestsForOrderItem(item.id);
      if (!existingRequests || existingRequests.length === 0) {
        // Create return request
        try {
          let returnRequest = await returnHandlers.createReturnRequest(
            req.user.id,
            orderId,
            item.id,
            'return',
            defaultReasonId,
            defaultDescription,
            []
          );
          // Update the return request status to 'marked_for_return'
          returnRequest = await storage.updateReturnRequest(returnRequest.id, { status: 'marked_for_return' });
          createdReturnRequests.push(returnRequest);
        } catch (err) {
          // Log and continue
          console.error('Error creating return request for item', item.id, err);
        }
      }
    }
    return res.json({ updatedOrder, createdReturnRequests });
  } catch (error) {
    const err = error as Error;
    console.error('Error marking order for return:', err.message || err);
    return res.status(500).json({ error: err.message || 'Failed to mark order for return' });
  }
});

// Admin: Update order status directly for pseudo orders
router.post('/admin/orders/:orderId/update-status', async (req, res) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ error: 'Missing orderId or status' });
    }
    const updatedOrder = await storage.updateOrderStatus(orderId, status);
    return res.json(updatedOrder);
  } catch (error) {
    const err = error as Error;
    console.error('Error updating order status (admin):', err.message || err);
    return res.status(500).json({ error: err.message || 'Failed to update order status' });
  }
});

// Upload images for return request
router.post("/upload-images", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // This would typically handle file uploads
    // For now, we'll return a mock response
    // In a real implementation, you'd use multer or similar to handle file uploads
    
    return res.json({
      urls: [
        "https://example.com/return-image-1.jpg",
        "https://example.com/return-image-2.jpg"
      ]
    });
  } catch (error) {
    const err = error as Error;
    console.error("Error uploading images:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to upload images" });
  }
});

export default router;