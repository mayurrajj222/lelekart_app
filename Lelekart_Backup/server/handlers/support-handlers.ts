import { Request, Response } from "express";
import { storage } from "../storage";
import { InsertSupportTicket, InsertSupportMessage } from "@shared/schema";
import { z } from "zod";

// Get all support tickets for a user
export async function getSupportTicketsHandler(req: Request, res: Response) {
  try {
    // If admin or co-admin, return all tickets with user info
    if (req.user?.role === 'admin' || req.user?.role === 'co-admin') {
      const tickets = await storage.getAllSupportTickets();
      // Already includes userName and userEmail from the join
      return res.status(200).json(tickets);
    }
    // Otherwise, return only tickets for the current user
    const userId = parseInt(req.params.userId || req.user?.id?.toString() || "0");
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const tickets = await storage.getSellerSupportTickets(userId);
    return res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get a specific ticket by ID
export async function getSupportTicketByIdHandler(req: Request, res: Response) {
  try {
    const ticketId = parseInt(req.params.id);
    
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    const ticket = await storage.getSupportTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }
    
    // If this is not an admin, co-admin, or the owner of the ticket, deny access
    if (req.user?.role !== 'admin' && req.user?.role !== 'co-admin' && req.user?.id !== ticket.userId) {
      return res.status(403).json({ error: 'You do not have permission to view this support ticket' });
    }
    
    // Get messages for this ticket
    const messages = await storage.getSupportMessages(ticketId);
    
    return res.status(200).json({
      ticket,
      messages
    });
  } catch (error) {
    console.error("Error fetching support ticket:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Create a new support ticket
export async function createSupportTicketHandler(req: Request, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'You must be logged in to create a support ticket' });
    }
    
    const ticketSchema = z.object({
      subject: z.string().min(1, 'Subject is required'),
      description: z.string().min(1, 'Description is required'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      category: z.string().min(1, 'Category is required'),
      attachments: z.string().optional(),
    });
    
    const validatedData = ticketSchema.parse(req.body);
    
    const ticketData: InsertSupportTicket = {
      userId: req.user.id,
      subject: validatedData.subject,
      description: validatedData.description,
      priority: validatedData.priority,
      category: validatedData.category,
      attachments: validatedData.attachments
    };
    
    const newTicket = await storage.createSupportTicket(ticketData);
    
    return res.status(201).json(newTicket);
  } catch (error) {
    console.error("Error creating support ticket:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update a support ticket (status, priority, etc.)
export async function updateSupportTicketHandler(req: Request, res: Response) {
  try {
    const ticketId = parseInt(req.params.id);
    
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    const ticket = await storage.getSupportTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }
    
    // If this is not an admin/co-admin or the ticket owner, deny access
    const isAdminOrCoAdmin = req.user?.role === 'admin' || req.user?.role === 'co-admin';
    const isTicketOwner = req.user?.id === ticket.userId;
    
    if (!isAdminOrCoAdmin && !isTicketOwner) {
      return res.status(403).json({ error: 'You do not have permission to update this ticket' });
    }
    
    // The ticket owner can only update limited fields
    let updateSchema: any;
    
    if (isAdminOrCoAdmin) {
      // Admins and co-admins can update all fields
      updateSchema = z.object({
        status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        assignedTo: z.number().int().optional().nullable(),
        category: z.string().optional(),
      });
    } else {
      // Ticket owners can only update limited fields
      updateSchema = z.object({
        status: z.literal('closed').optional(), // Can only close their own ticket
      });
    }
    
    const validatedData = updateSchema.parse(req.body);
    
    // If the status is being set to 'resolved', set the resolved date
    if (validatedData.status === 'resolved') {
      validatedData.resolvedDate = new Date();
    }
    
    const updatedTicket = await storage.updateSupportTicket(ticketId, validatedData);
    
    return res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error updating support ticket:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Add a message to a support ticket
export async function addSupportMessageHandler(req: Request, res: Response) {
  try {
    const ticketId = parseInt(req.params.id);
    
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({ error: 'You must be logged in to add a message' });
    }
    
    const ticket = await storage.getSupportTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }
    
    // If this is not an admin/co-admin or the ticket owner, deny access
    const isAdminOrCoAdmin = req.user.role === 'admin' || req.user.role === 'co-admin';
    const isTicketOwner = req.user.id === ticket.userId;
    
    if (!isAdminOrCoAdmin && !isTicketOwner) {
      return res.status(403).json({ error: 'You do not have permission to add a message to this ticket' });
    }
    
    const messageSchema = z.object({
      message: z.string().min(1, 'Message is required'),
      attachments: z.string().optional(),
    });
    
    const validatedData = messageSchema.parse(req.body);
    
    const messageData: InsertSupportMessage = {
      ticketId,
      userId: req.user.id,
      message: validatedData.message,
      attachments: validatedData.attachments
    };
    
    const newMessage = await storage.createSupportMessage(messageData);
    
    // If this is a response from an admin/co-admin, update the ticket status to 'in_progress' if it's currently 'open'
    if (isAdminOrCoAdmin && ticket.status === 'open') {
      await storage.updateSupportTicket(ticketId, { 
        status: 'in_progress',
        assignedTo: req.user.id // Auto-assign to the responding admin/co-admin
      });
    }
    
    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating support message:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get all messages for a specific ticket
export async function getSupportMessagesHandler(req: Request, res: Response) {
  try {
    const ticketId = parseInt(req.params.id);
    
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    
    const ticket = await storage.getSupportTicketById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }
    
    // If this is not an admin/co-admin or the ticket owner, deny access
    const isAdminOrCoAdmin = req.user?.role === 'admin' || req.user?.role === 'co-admin';
    const isTicketOwner = req.user?.id === ticket.userId;
    
    if (!isAdminOrCoAdmin && !isTicketOwner) {
      return res.status(403).json({ error: 'You do not have permission to view messages for this ticket' });
    }
    
    const messages = await storage.getSupportMessages(ticketId);
    
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching support messages:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Delete a support ticket by ID
export async function deleteSupportTicketHandler(req: Request, res: Response) {
  try {
    const ticketId = parseInt(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }
    const ticket = await storage.getSupportTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }
    // Only allow owner or admin/co-admin to delete
    if (
      req.user?.role !== 'admin' &&
      req.user?.role !== 'co-admin' &&
      req.user?.id !== ticket.userId
    ) {
      return res.status(403).json({ error: 'You do not have permission to delete this support ticket' });
    }
    await storage.deleteSupportTicket(ticketId);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}