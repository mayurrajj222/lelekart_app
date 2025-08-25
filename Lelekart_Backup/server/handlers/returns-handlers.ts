import { Request, Response } from "express";
import { storage } from "../storage";
import { InsertReturnRequest } from "@shared/return-schema";
import { z } from "zod";

// Helper function to determine seller ID from order items
async function determineSellerIdFromOrder(
  orderId: number
): Promise<number | null> {
  try {
    console.log(`[RETURN] Determining seller ID for order ${orderId}`);
    const orderItems = await storage.getOrderItems(orderId);
    console.log(
      `[RETURN] Found ${orderItems.length} order items for order ${orderId}`
    );

    if (orderItems.length > 0) {
      const firstItem = orderItems[0];
      console.log(`[RETURN] First order item:`, firstItem);

      // Check if the order item has product information
      if (firstItem.product) {
        console.log(
          `[RETURN] Product found for ID ${firstItem.productId}:`,
          firstItem.product
        );

        if (firstItem.product.sellerId) {
          console.log(
            `[RETURN] Successfully determined seller ID from product: ${firstItem.product.sellerId}`
          );
          return firstItem.product.sellerId;
        } else {
          console.log(
            `[RETURN] Product has no seller ID for product ${firstItem.productId}`
          );
        }
      } else {
        console.log(
          `[RETURN] No product information found for order item ${firstItem.id}`
        );
      }

      // Try to get seller ID from the order itself if available
      const order = await storage.getOrder(orderId);
      if (order && order.sellerId) {
        console.log(`[RETURN] Using seller ID from order: ${order.sellerId}`);
        return order.sellerId;
      }

      // If still no seller ID, try to get it from the user who created the order
      if (order && order.userId) {
        const user = await storage.getUser(order.userId);
        if (user && user.role === "seller") {
          console.log(`[RETURN] Using seller ID from order user: ${user.id}`);
          return user.id;
        }
      }

      console.log(
        `[RETURN] Could not determine seller ID for order ${orderId}`
      );
      return null;
    } else {
      console.log(`[RETURN] No order items found for order ${orderId}`);
      return null;
    }
  } catch (error) {
    console.error(
      `[RETURN] Error determining seller ID from order ${orderId}:`,
      error
    );
    return null;
  }
}

// Get all returns for a seller
export async function getSellerReturnsHandler(req: Request, res: Response) {
  try {
    const sellerId = req.user.id;
    console.log(`[RETURN] Getting returns for seller ID: ${sellerId}`);

    // Get returns from the new return system
    const returnRequests = await storage.getReturnRequestsBySellerId(sellerId);
    console.log(
      `[RETURN] Found ${returnRequests.length} return requests for seller ${sellerId}`
    );

    // Get orders marked for return for this seller
    const orders = await storage.getOrders(sellerId, sellerId);
    const ordersMarkedForReturn = orders.filter(
      (order) => order.status === "marked_for_return"
    );
    console.log(
      `[RETURN] Found ${ordersMarkedForReturn.length} orders marked for return for seller ${sellerId}`
    );

    // Convert orders marked for return to return-like objects
    const orderReturns = await Promise.all(
      ordersMarkedForReturn.map(async (order) => {
        const sellerId = await determineSellerIdFromOrder(order.id);
        return {
          id: order.id,
          orderId: order.id,
          orderItemId: null,
          sellerId: sellerId,
          buyerId: order.userId,
          requestType: "return",
          reasonId: 1, // Default reason
          description: "Order marked for return",
          status: "marked_for_return",
          createdAt: order.date,
          updatedAt: order.date,
          isOrderOnly: true, // Flag to indicate this is an order, not a return request
          // Add order details for frontend
          order: order,
          buyer: await storage.getUser(order.userId),
          orderItems: await storage.getOrderItems(order.id),
        };
      })
    );

    // Combine both types of returns
    const allReturns = [...returnRequests, ...orderReturns];

    // Sort returns: pending/requested returns first, then by creation date (newest first)
    const sortedReturns = allReturns.sort((a, b) => {
      // Define priority order for statuses
      const statusPriority = {
        pending: 1,
        requested: 1,
        marked_for_return: 1,
        approved: 2,
        processing: 3,
        item_received: 4,
        refund_processed: 5,
        replacement_in_transit: 6,
        completed: 7,
        rejected: 8,
        cancelled: 9,
      };

      const aPriority = statusPriority[a.status] || 10;
      const bPriority = statusPriority[b.status] || 10;

      // If priorities are different, sort by priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // If priorities are the same, sort by creation date (newest first)
      const aDate = new Date(a.createdAt || a.date);
      const bDate = new Date(b.createdAt || b.date);
      return bDate.getTime() - aDate.getTime();
    });

    console.log(
      `[RETURN] Returning ${sortedReturns.length} total returns for seller ${sellerId}`
    );
    return res.status(200).json(sortedReturns);
  } catch (error) {
    console.error(
      `[RETURN] Error fetching seller returns for seller ${req.user.id}:`,
      error
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get a specific return by ID
export async function getReturnByIdHandler(req: Request, res: Response) {
  try {
    const returnId = parseInt(req.params.id);
    console.log(
      `[RETURN] Getting return details for ID: ${returnId}, requested by user: ${req.user.id}`
    );

    if (isNaN(returnId)) {
      console.log(`[RETURN] Invalid return ID provided: ${req.params.id}`);
      return res.status(400).json({ error: "Invalid return ID" });
    }

    // First, try to get from the new return system
    let returnData = await storage.getReturnRequestById(returnId);
    console.log(
      `[RETURN] Return data found in return_requests:`,
      returnData ? `ID ${returnId}` : "Not found"
    );

    // If not found in return_requests, try the old returns table
    if (!returnData) {
      console.log(`[RETURN] Trying old returns table for ID: ${returnId}`);
      returnData = await storage.getReturnById(returnId);
      console.log(
        `[RETURN] Return data found in returns:`,
        returnData ? `ID ${returnId}` : "Not found"
      );
    }

    // If still not found, check if it's an order with marked_for_return status
    if (!returnData) {
      console.log(
        `[RETURN] Trying to find order with marked_for_return status for ID: ${returnId}`
      );
      const order = await storage.getOrder(returnId);
      if (order && order.status === "marked_for_return") {
        console.log(
          `[RETURN] Found order with marked_for_return status:`,
          order
        );
        // Determine seller ID from order items
        const sellerId = await determineSellerIdFromOrder(returnId);
        console.log(`[RETURN] Determined seller ID from order: ${sellerId}`);

        // Create a pseudo return request object
        returnData = {
          id: returnId,
          orderId: order.id,
          orderItemId: null,
          sellerId: sellerId,
          buyerId: order.userId,
          requestType: "return",
          reasonId: 1, // Default reason
          description: "Order marked for return",
          status: "marked_for_return",
          createdAt: order.date,
          updatedAt: order.date,
          isOrderOnly: true, // Flag to indicate this is an order, not a return request
        };
        console.log(
          `[RETURN] Created pseudo return data for order:`,
          returnData
        );
      }
    }

    if (!returnData) {
      console.log(`[RETURN] Return not found for ID: ${returnId}`);
      return res.status(404).json({ error: "Return not found" });
    }

    // Check if the requesting user is the seller of this return
    if (req.user?.role !== "admin" && req.user?.id !== returnData.sellerId) {
      console.log(
        `[RETURN] Access denied - User ${req.user.id} (${req.user.role}) trying to access return ${returnId} owned by seller ${returnData.sellerId}`
      );

      // If sellerId is null, allow admin users to access the return
      if (returnData.sellerId === null && req.user?.role === "admin") {
        console.log(
          `[RETURN] Allowing admin user ${req.user.id} to access return ${returnId} with null seller ID`
        );
      } else {
        return res
          .status(403)
          .json({ error: "You do not have permission to view this return" });
      }
    }

    // Get additional details for the return
    let returnWithDetails;
    if (returnData.isOrderOnly) {
      // For orders marked for return, get order details
      const order = await storage.getOrder(returnData.orderId);
      const orderItems = await storage.getOrderItems(returnData.orderId);
      const buyer = await storage.getUser(returnData.buyerId);

      returnWithDetails = {
        ...returnData,
        order,
        orderItems,
        buyer,
        isOrderOnly: true,
      };
    } else {
      // For actual return requests, get full details
      returnWithDetails = await storage.getReturnRequestWithDetails(returnId);
    }

    console.log(
      `[RETURN] Return details retrieved successfully for ID: ${returnId}`
    );
    return res.status(200).json(returnWithDetails);
  } catch (error) {
    console.error(`[RETURN] Error fetching return ${req.params.id}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Create a new return request
export async function createReturnHandler(req: Request, res: Response) {
  try {
    console.log(
      `[RETURN] Creating new return request by user: ${req.user.id}`,
      req.body
    );

    const returnSchema = z.object({
      orderId: z.number(),
      orderItemId: z.number(),
      requestType: z.string(),
      reasonId: z.number(),
      description: z.string().optional(),
      mediaUrls: z.array(z.string()).optional(),
    });

    const validatedData = returnSchema.parse(req.body);
    console.log(`[RETURN] Validated return data:`, validatedData);

    // Use the new return system
    const newReturn = await storage.createReturnRequest({
      orderId: validatedData.orderId,
      orderItemId: validatedData.orderItemId,
      buyerId: req.user.id,
      sellerId: req.user.id, // This will be updated based on the order item
      requestType: validatedData.requestType,
      reasonId: validatedData.reasonId,
      description: validatedData.description,
      mediaUrls: validatedData.mediaUrls || [],
      status: "pending",
    });

    console.log(
      `[RETURN] Return request created successfully with ID: ${newReturn.id}`
    );
    return res.status(201).json(newReturn);
  } catch (error) {
    console.error(`[RETURN] Error creating return request:`, error);
    if (error instanceof z.ZodError) {
      console.log(`[RETURN] Validation error:`, error.errors);
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update return status
export async function updateReturnStatusHandler(req: Request, res: Response) {
  try {
    const returnId = parseInt(req.params.id);
    const { status, notes } = req.body;
    console.log(
      `[RETURN] Updating return status - ID: ${returnId}, Status: ${status}, User: ${req.user.id}`,
      req.body
    );

    if (isNaN(returnId)) {
      console.log(`[RETURN] Invalid return ID provided: ${req.params.id}`);
      return res.status(400).json({ error: "Invalid return ID" });
    }

    // Use the new return system
    const returnData = await storage.getReturnRequestById(returnId);
    console.log(
      `[RETURN] Return data found for status update:`,
      returnData ? `ID ${returnId}` : "Not found"
    );

    if (!returnData) {
      console.log(
        `[RETURN] Return not found for status update - ID: ${returnId}`
      );
      return res.status(404).json({ error: "Return not found" });
    }

    // Check if the requesting user is the seller of this return
    if (req.user?.role !== "admin" && req.user?.id !== returnData.sellerId) {
      console.log(
        `[RETURN] Access denied for status update - User ${req.user.id} trying to update return ${returnId} owned by seller ${returnData.sellerId}`
      );
      return res
        .status(403)
        .json({ error: "You do not have permission to update this return" });
    }

    if (!status) {
      console.log(`[RETURN] Missing status in request body`);
      return res.status(400).json({ error: "Return status is required" });
    }

    // Update the return request
    const updatedReturn = await storage.updateReturnRequest(returnId, {
      status,
      sellerResponse: notes,
      sellerResponseDate: new Date(),
    });

    // Add status history entry
    await storage.createReturnStatusHistory({
      returnRequestId: returnId,
      newStatus: status,
      changedById: req.user.id,
      notes: notes || `Status updated to ${status}`,
    });

    console.log(
      `[RETURN] Return status updated successfully - ID: ${returnId}, New Status: ${status}`
    );
    return res.status(200).json(updatedReturn);
  } catch (error) {
    console.error(
      `[RETURN] Error updating return status for ID ${req.params.id}:`,
      error
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function acceptReturnHandler(req: Request, res: Response) {
  try {
    const returnId = parseInt(req.params.id);
    const { note } = req.body;
    console.log(
      `[RETURN] Accepting return - ID: ${returnId}, User: ${req.user.id}`,
      req.body
    );

    if (isNaN(returnId)) {
      console.log(
        `[RETURN] Invalid return ID provided for accept: ${req.params.id}`
      );
      return res.status(400).json({ error: "Invalid return ID" });
    }

    // First, try to get from the new return system
    let returnData = await storage.getReturnRequestById(returnId);
    console.log(
      `[RETURN] Return data found in return_requests for accept:`,
      returnData ? `ID ${returnId}` : "Not found"
    );

    // If not found in return_requests, try the old returns table
    if (!returnData) {
      console.log(
        `[RETURN] Trying old returns table for accept - ID: ${returnId}`
      );
      returnData = await storage.getReturnById(returnId);
      console.log(
        `[RETURN] Return data found in returns for accept:`,
        returnData ? `ID ${returnId}` : "Not found"
      );
    }

    // If still not found, check if it's an order with marked_for_return status
    if (!returnData) {
      console.log(
        `[RETURN] Trying to find order with marked_for_return status for accept - ID: ${returnId}`
      );
      const order = await storage.getOrder(returnId);
      if (order && order.status === "marked_for_return") {
        console.log(
          `[RETURN] Found order with marked_for_return status for accept:`,
          order
        );
        // Determine seller ID from order items
        const sellerId = await determineSellerIdFromOrder(returnId);
        console.log(
          `[RETURN] Determined seller ID from order for accept: ${sellerId}`
        );

        // Create a pseudo return request object
        returnData = {
          id: returnId,
          orderId: order.id,
          orderItemId: null,
          sellerId: sellerId,
          buyerId: order.userId,
          requestType: "return",
          reasonId: 1, // Default reason
          description: "Order marked for return",
          status: "marked_for_return",
          createdAt: order.date,
          updatedAt: order.date,
          isOrderOnly: true, // Flag to indicate this is an order, not a return request
        };
        console.log(
          `[RETURN] Created pseudo return data for accept:`,
          returnData
        );
      }
    }

    if (!returnData) {
      console.log(`[RETURN] Return not found for accept - ID: ${returnId}`);
      return res.status(404).json({ error: "Return not found" });
    }

    // Check if the requesting user is the seller of this return
    if (req.user?.role !== "admin" && req.user?.id !== returnData.sellerId) {
      console.log(
        `[RETURN] Access denied for accept - User ${req.user.id} trying to accept return ${returnId} owned by seller ${returnData.sellerId}`
      );

      // If sellerId is null, allow admin users to process the return
      if (returnData.sellerId === null && req.user?.role === "admin") {
        console.log(
          `[RETURN] Allowing admin user ${req.user.id} to process return ${returnId} with null seller ID`
        );
      } else {
        return res
          .status(403)
          .json({ error: "You do not have permission to update this return" });
      }
    }

    let updatedReturn;

    if (returnData.isOrderOnly) {
      // For orders marked for return, update the order status
      console.log(
        `[RETURN] Updating order status for order-only return - ID: ${returnId}`
      );
      updatedReturn = await storage.updateOrder(returnId, {
        status: "return_approved",
        updatedAt: new Date(),
      });
      console.log(
        `[RETURN] Order status updated to return_approved for ID: ${returnId}`
      );
    } else {
      // For actual return requests, update the return request
      console.log(
        `[RETURN] Updating return request status for ID: ${returnId}`
      );
      updatedReturn = await storage.updateReturnRequest(returnId, {
        status: "approved",
        sellerResponse: note || "Return request accepted by seller",
        sellerResponseDate: new Date(),
      });

      // Add status history entry
      await storage.createReturnStatusHistory({
        returnRequestId: returnId,
        newStatus: "approved",
        changedById: req.user.id,
        notes: note || "Return request accepted by seller",
      });
    }

    console.log(`[RETURN] Return accepted successfully - ID: ${returnId}`);
    return res.status(200).json(updatedReturn);
  } catch (error) {
    console.error(`[RETURN] Error accepting return ${req.params.id}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function rejectReturnHandler(req: Request, res: Response) {
  try {
    const returnId = parseInt(req.params.id);
    const { note } = req.body;
    console.log(
      `[RETURN] Rejecting return - ID: ${returnId}, User: ${req.user.id}`,
      req.body
    );

    if (isNaN(returnId)) {
      console.log(
        `[RETURN] Invalid return ID provided for reject: ${req.params.id}`
      );
      return res.status(400).json({ error: "Invalid return ID" });
    }

    if (!note) {
      console.log(
        `[RETURN] Missing rejection reason for return ID: ${returnId}`
      );
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    // First, try to get from the new return system
    let returnData = await storage.getReturnRequestById(returnId);
    console.log(
      `[RETURN] Return data found in return_requests for reject:`,
      returnData ? `ID ${returnId}` : "Not found"
    );

    // If not found in return_requests, try the old returns table
    if (!returnData) {
      console.log(
        `[RETURN] Trying old returns table for reject - ID: ${returnId}`
      );
      returnData = await storage.getReturnById(returnId);
      console.log(
        `[RETURN] Return data found in returns for reject:`,
        returnData ? `ID ${returnId}` : "Not found"
      );
    }

    // If still not found, check if it's an order with marked_for_return status
    if (!returnData) {
      console.log(
        `[RETURN] Trying to find order with marked_for_return status for reject - ID: ${returnId}`
      );
      const order = await storage.getOrder(returnId);
      if (order && order.status === "marked_for_return") {
        console.log(
          `[RETURN] Found order with marked_for_return status for reject:`,
          order
        );
        // Determine seller ID from order items
        const sellerId = await determineSellerIdFromOrder(returnId);
        console.log(
          `[RETURN] Determined seller ID from order for reject: ${sellerId}`
        );

        // Create a pseudo return request object
        returnData = {
          id: returnId,
          orderId: order.id,
          orderItemId: null,
          sellerId: sellerId,
          buyerId: order.userId,
          requestType: "return",
          reasonId: 1, // Default reason
          description: "Order marked for return",
          status: "marked_for_return",
          createdAt: order.date,
          updatedAt: order.date,
          isOrderOnly: true, // Flag to indicate this is an order, not a return request
        };
        console.log(
          `[RETURN] Created pseudo return data for reject:`,
          returnData
        );
      }
    }

    if (!returnData) {
      console.log(`[RETURN] Return not found for reject - ID: ${returnId}`);
      return res.status(404).json({ error: "Return not found" });
    }

    // Check if the requesting user is the seller of this return
    if (req.user?.role !== "admin" && req.user?.id !== returnData.sellerId) {
      console.log(
        `[RETURN] Access denied for reject - User ${req.user.id} trying to reject return ${returnId} owned by seller ${returnData.sellerId}`
      );

      // If sellerId is null, allow admin users to process the return
      if (returnData.sellerId === null && req.user?.role === "admin") {
        console.log(
          `[RETURN] Allowing admin user ${req.user.id} to process return ${returnId} with null seller ID`
        );
      } else {
        return res
          .status(403)
          .json({ error: "You do not have permission to update this return" });
      }
    }

    let updatedReturn;

    if (returnData.isOrderOnly) {
      // For orders marked for return, update the order status
      console.log(
        `[RETURN] Updating order status for order-only return reject - ID: ${returnId}`
      );
      updatedReturn = await storage.updateOrder(returnId, {
        status: "return_rejected",
        updatedAt: new Date(),
      });
      console.log(
        `[RETURN] Order status updated to return_rejected for ID: ${returnId}`
      );
    } else {
      // For actual return requests, update the return request
      console.log(
        `[RETURN] Updating return request status for reject - ID: ${returnId}`
      );
      updatedReturn = await storage.updateReturnRequest(returnId, {
        status: "rejected",
        sellerResponse: note,
        sellerResponseDate: new Date(),
      });

      // Add status history entry
      await storage.createReturnStatusHistory({
        returnRequestId: returnId,
        newStatus: "rejected",
        changedById: req.user.id,
        notes: note,
      });
    }

    console.log(
      `[RETURN] Return rejected successfully - ID: ${returnId}, Reason: ${note}`
    );
    return res.status(200).json(updatedReturn);
  } catch (error) {
    console.error(`[RETURN] Error rejecting return ${req.params.id}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function processReturnHandler(req: Request, res: Response) {
  try {
    const returnId = parseInt(req.params.id);
    const { note } = req.body;
    console.log(
      `[RETURN] Processing return - ID: ${returnId}, User: ${req.user.id}`,
      req.body
    );

    if (isNaN(returnId)) {
      console.log(
        `[RETURN] Invalid return ID provided for process: ${req.params.id}`
      );
      return res.status(400).json({ error: "Invalid return ID" });
    }

    // Use the new return system
    const returnData = await storage.getReturnRequestById(returnId);
    console.log(
      `[RETURN] Return data found for process:`,
      returnData ? `ID ${returnId}` : "Not found"
    );

    if (!returnData) {
      console.log(`[RETURN] Return not found for process - ID: ${returnId}`);
      return res.status(404).json({ error: "Return not found" });
    }

    // Check if the requesting user is the seller of this return
    if (req.user?.role !== "admin" && req.user?.id !== returnData.sellerId) {
      console.log(
        `[RETURN] Access denied for process - User ${req.user.id} trying to process return ${returnId} owned by seller ${returnData.sellerId}`
      );
      return res
        .status(403)
        .json({ error: "You do not have permission to update this return" });
    }

    // Update return status to processing
    const updatedReturn = await storage.updateReturnRequest(returnId, {
      status: "processing",
      sellerResponse: note,
      sellerResponseDate: new Date(),
    });

    // Add status history entry
    await storage.createReturnStatusHistory({
      returnRequestId: returnId,
      newStatus: "processing",
      changedById: req.user.id,
      notes: note || "Return processing initiated by seller",
    });

    console.log(
      `[RETURN] Return processing initiated successfully - ID: ${returnId}`
    );
    return res.status(200).json(updatedReturn);
  } catch (error) {
    console.error(`[RETURN] Error processing return ${req.params.id}:`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function addReturnMessageHandler(req: Request, res: Response) {
  try {
    const returnId = parseInt(req.params.id);
    const { message, mediaUrls } = req.body;
    console.log(
      `[RETURN] Adding message to return - ID: ${returnId}, User: ${req.user.id}`,
      req.body
    );

    if (isNaN(returnId)) {
      console.log(
        `[RETURN] Invalid return ID provided for message: ${req.params.id}`
      );
      return res.status(400).json({ error: "Invalid return ID" });
    }

    if (!message) {
      console.log(`[RETURN] Missing message for return ID: ${returnId}`);
      return res.status(400).json({ error: "Message is required" });
    }

    // Use the new return system
    const returnData = await storage.getReturnRequestById(returnId);
    console.log(
      `[RETURN] Return data found for message:`,
      returnData ? `ID ${returnId}` : "Not found"
    );

    if (!returnData) {
      console.log(`[RETURN] Return not found for message - ID: ${returnId}`);
      return res.status(404).json({ error: "Return not found" });
    }

    // Check if the requesting user is the seller of this return
    if (req.user?.role !== "admin" && req.user?.id !== returnData.sellerId) {
      console.log(
        `[RETURN] Access denied for message - User ${req.user.id} trying to add message to return ${returnId} owned by seller ${returnData.sellerId}`
      );
      return res.status(403).json({
        error: "You do not have permission to add messages to this return",
      });
    }

    // Add the message
    const newMessage = await storage.createReturnMessage({
      returnRequestId: returnId,
      senderId: req.user.id,
      senderRole: req.user.role === "admin" ? "admin" : "seller",
      message,
      mediaUrls: mediaUrls || [],
    });

    console.log(
      `[RETURN] Message added successfully - Return ID: ${returnId}, Message ID: ${newMessage.id}`
    );
    return res.status(201).json(newMessage);
  } catch (error) {
    console.error(
      `[RETURN] Error adding return message for ID ${req.params.id}:`,
      error
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function markReturnReceivedHandler(req: Request, res: Response) {
  try {
    const returnId = parseInt(req.params.id);
    const { condition, notes } = req.body;
    console.log(
      `[RETURN] Marking return as received - ID: ${returnId}, User: ${req.user.id}`,
      req.body
    );

    if (isNaN(returnId)) {
      console.log(
        `[RETURN] Invalid return ID provided for received: ${req.params.id}`
      );
      return res.status(400).json({ error: "Invalid return ID" });
    }

    if (!condition) {
      console.log(`[RETURN] Missing item condition for return ID: ${returnId}`);
      return res.status(400).json({ error: "Item condition is required" });
    }

    // Use the new return system
    const returnData = await storage.getReturnRequestById(returnId);
    console.log(
      `[RETURN] Return data found for received:`,
      returnData ? `ID ${returnId}` : "Not found"
    );

    if (!returnData) {
      console.log(`[RETURN] Return not found for received - ID: ${returnId}`);
      return res.status(404).json({ error: "Return not found" });
    }

    // Check if the requesting user is the seller of this return
    if (req.user?.role !== "admin" && req.user?.id !== returnData.sellerId) {
      console.log(
        `[RETURN] Access denied for received - User ${req.user.id} trying to mark return ${returnId} as received, owned by seller ${returnData.sellerId}`
      );
      return res
        .status(403)
        .json({ error: "You do not have permission to update this return" });
    }

    // Update return status to item_received
    const updatedReturn = await storage.updateReturnRequest(returnId, {
      status: "item_received",
      returnCondition: condition,
      returnReceivedDate: new Date(),
    });

    // Add status history entry
    await storage.createReturnStatusHistory({
      returnRequestId: returnId,
      newStatus: "item_received",
      changedById: req.user.id,
      notes: notes || `Item received in ${condition} condition`,
    });

    console.log(
      `[RETURN] Return marked as received successfully - ID: ${returnId}, Condition: ${condition}`
    );
    return res.status(200).json(updatedReturn);
  } catch (error) {
    console.error(
      `[RETURN] Error marking return as received for ID ${req.params.id}:`,
      error
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function processRefundHandler(req: Request, res: Response) {
  try {
    const returnId = parseInt(req.params.id);
    const { notes } = req.body;
    console.log(
      `[RETURN] Processing refund - ID: ${returnId}, User: ${req.user.id}`,
      req.body
    );

    if (isNaN(returnId)) {
      console.log(
        `[RETURN] Invalid return ID provided for refund: ${req.params.id}`
      );
      return res.status(400).json({ error: "Invalid return ID" });
    }

    // Use the new return system
    const returnData = await storage.getReturnRequestById(returnId);
    console.log(
      `[RETURN] Return data found for refund:`,
      returnData ? `ID ${returnId}` : "Not found"
    );

    if (!returnData) {
      console.log(`[RETURN] Return not found for refund - ID: ${returnId}`);
      return res.status(404).json({ error: "Return not found" });
    }

    // Check if the requesting user is the seller of this return
    if (req.user?.role !== "admin" && req.user?.id !== returnData.sellerId) {
      console.log(
        `[RETURN] Access denied for refund - User ${req.user.id} trying to process refund for return ${returnId} owned by seller ${returnData.sellerId}`
      );
      return res
        .status(403)
        .json({ error: "You do not have permission to update this return" });
    }

    // Update return status to refund_processed
    const updatedReturn = await storage.updateReturnRequest(returnId, {
      status: "refund_processed",
      refundProcessed: true,
    });

    // Add status history entry
    await storage.createReturnStatusHistory({
      returnRequestId: returnId,
      newStatus: "refund_processed",
      changedById: req.user.id,
      notes: notes || "Refund processed by seller",
    });

    console.log(`[RETURN] Refund processed successfully - ID: ${returnId}`);
    return res.status(200).json(updatedReturn);
  } catch (error) {
    console.error(
      `[RETURN] Error processing refund for ID ${req.params.id}:`,
      error
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function shipReplacementHandler(req: Request, res: Response) {
  try {
    const returnId = parseInt(req.params.id);
    const { trackingInfo, notes } = req.body;
    console.log(
      `[RETURN] Shipping replacement - ID: ${returnId}, User: ${req.user.id}`,
      req.body
    );

    if (isNaN(returnId)) {
      console.log(
        `[RETURN] Invalid return ID provided for replacement: ${req.params.id}`
      );
      return res.status(400).json({ error: "Invalid return ID" });
    }

    // Use the new return system
    const returnData = await storage.getReturnRequestById(returnId);
    console.log(
      `[RETURN] Return data found for replacement:`,
      returnData ? `ID ${returnId}` : "Not found"
    );

    if (!returnData) {
      console.log(
        `[RETURN] Return not found for replacement - ID: ${returnId}`
      );
      return res.status(404).json({ error: "Return not found" });
    }

    // Check if the requesting user is the seller of this return
    if (req.user?.role !== "admin" && req.user?.id !== returnData.sellerId) {
      console.log(
        `[RETURN] Access denied for replacement - User ${req.user.id} trying to ship replacement for return ${returnId} owned by seller ${returnData.sellerId}`
      );
      return res
        .status(403)
        .json({ error: "You do not have permission to update this return" });
    }

    // Update return status to replacement_in_transit
    const updatedReturn = await storage.updateReturnRequest(returnId, {
      status: "replacement_in_transit",
      replacementTracking: trackingInfo || {},
    });

    // Add status history entry
    await storage.createReturnStatusHistory({
      returnRequestId: returnId,
      newStatus: "replacement_in_transit",
      changedById: req.user.id,
      notes: notes || "Replacement shipped by seller",
    });

    console.log(
      `[RETURN] Replacement shipped successfully - ID: ${returnId}, Tracking:`,
      trackingInfo
    );
    return res.status(200).json(updatedReturn);
  } catch (error) {
    console.error(
      `[RETURN] Error shipping replacement for ID ${req.params.id}:`,
      error
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function generateReturnLabelHandler(req: Request, res: Response) {
  try {
    const returnId = parseInt(req.params.id);
    console.log(
      `[RETURN] Generating return label - ID: ${returnId}, User: ${req.user.id}`
    );

    if (isNaN(returnId)) {
      console.log(
        `[RETURN] Invalid return ID provided for label: ${req.params.id}`
      );
      return res.status(400).json({ error: "Invalid return ID" });
    }

    // Use the new return system
    const returnData = await storage.getReturnRequestById(returnId);
    console.log(
      `[RETURN] Return data found for label:`,
      returnData ? `ID ${returnId}` : "Not found"
    );

    if (!returnData) {
      console.log(`[RETURN] Return not found for label - ID: ${returnId}`);
      return res.status(404).json({ error: "Return not found" });
    }

    // Check if the requesting user is the seller of this return
    if (req.user?.role !== "admin" && req.user?.id !== returnData.sellerId) {
      console.log(
        `[RETURN] Access denied for label - User ${req.user.id} trying to generate label for return ${returnId} owned by seller ${returnData.sellerId}`
      );
      return res
        .status(403)
        .json({ error: "You do not have permission to access this return" });
    }

    // For now, return a simple message. In a real implementation, you would generate a shipping label
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <html>
        <body>
          <h1>Return Shipping Label</h1>
          <p>Return ID: ${returnId}</p>
          <p>This is a placeholder for the actual shipping label generation.</p>
          <p>In a real implementation, this would generate a proper shipping label with tracking information.</p>
        </body>
      </html>
    `);

    console.log(
      `[RETURN] Return label generated successfully - ID: ${returnId}`
    );
  } catch (error) {
    console.error(
      `[RETURN] Error generating return label for ID ${req.params.id}:`,
      error
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}
