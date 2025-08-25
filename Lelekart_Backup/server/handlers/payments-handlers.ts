import { Request, Response } from "express";
import { storage } from "../storage";
import { InsertSellerPayment } from "@shared/schema";
import { z } from "zod";

// Get all payments for a seller
export async function getSellerPaymentsHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(req.params.sellerId || req.user?.id?.toString() || "0");
    
    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }
    
    // If this is not an admin or the seller themselves, deny access
    if (req.user?.role !== 'admin' && req.user?.id !== sellerId) {
      return res.status(403).json({ error: 'You do not have permission to view these payments' });
    }
    
    const payments = await storage.getSellerPayments(sellerId);
    
    return res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching seller payments:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get a specific payment by ID
export async function getSellerPaymentByIdHandler(req: Request, res: Response) {
  try {
    const paymentId = parseInt(req.params.id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }
    
    const payment = await storage.getSellerPaymentById(paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // If this is not an admin or the seller themselves, deny access
    if (req.user?.role !== 'admin' && req.user?.id !== payment.sellerId) {
      return res.status(403).json({ error: 'You do not have permission to view this payment' });
    }
    
    return res.status(200).json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Create a new payment (admin only)
export async function createSellerPaymentHandler(req: Request, res: Response) {
  try {
    // Only admins can create payments
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can create payments' });
    }
    
    const paymentSchema = z.object({
      sellerId: z.number(),
      amount: z.number().positive(),
      status: z.string().default('pending'),
      paymentDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
      referenceId: z.string().optional(),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    });
    
    const validatedData = paymentSchema.parse(req.body);
    
    const newPayment = await storage.createSellerPayment(validatedData as InsertSellerPayment);
    
    return res.status(201).json(newPayment);
  } catch (error) {
    console.error("Error creating payment:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update payment status (admin only)
export async function updateSellerPaymentHandler(req: Request, res: Response) {
  try {
    // Only admins can update payments
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can update payments' });
    }
    
    const paymentId = parseInt(req.params.id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }
    
    const payment = await storage.getSellerPaymentById(paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    const paymentSchema = z.object({
      status: z.string().optional(),
      paymentDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
      referenceId: z.string().optional(),
      notes: z.string().optional(),
    });
    
    const validatedData = paymentSchema.parse(req.body);
    
    const updatedPayment = await storage.updateSellerPayment(paymentId, validatedData);
    
    return res.status(200).json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get payment summary for a seller
export async function getSellerPaymentsSummaryHandler(req: Request, res: Response) {
  try {
    const sellerId = parseInt(req.params.sellerId || req.user?.id?.toString() || "0");
    
    if (!sellerId) {
      return res.status(400).json({ error: 'Seller ID is required' });
    }
    
    // If this is not an admin or the seller themselves, deny access
    if (req.user?.role !== 'admin' && req.user?.id !== sellerId) {
      return res.status(403).json({ error: 'You do not have permission to view this payment summary' });
    }
    
    const payments = await storage.getSellerPayments(sellerId);
    
    // Calculate totals
    let totalPaid = 0;
    let totalPending = 0;
    let pendingPayments = 0;
    let completedPayments = 0;
    
    payments.forEach(payment => {
      if (payment.status === 'completed') {
        totalPaid += Number(payment.amount);
        completedPayments++;
      } else if (payment.status === 'pending') {
        totalPending += Number(payment.amount);
        pendingPayments++;
      }
    });
    
    // Get the latest 5 payments
    const recentPayments = payments.slice(0, 5);
    
    const summary = {
      totalPaid,
      totalPending,
      pendingPayments,
      completedPayments,
      totalPayments: payments.length,
      recentPayments
    };
    
    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}