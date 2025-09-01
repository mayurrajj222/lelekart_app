import { Request, Response } from "express";
import { db } from "../db";
import { chatSessions, chatMessages, users } from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendEmail, EMAIL_TEMPLATES } from "../services/email-service";
import { sendChatMessage, sendNewChatSessionNotification } from "../websocket";

// Create a new chat session
export async function createChatSession(req: Request, res: Response) {
  try {
    const { userName, userEmail, userId } = req.body;

    if (!userName) {
      return res.status(400).json({ error: "User name is required" });
    }

    const sessionId = uuidv4();
    const session = await db
      .insert(chatSessions)
      .values({
        id: sessionId,
        userId: userId || null,
        userName,
        userEmail: userEmail || null,
        status: "open",
        isRead: false,
      })
      .returning();

    // Send email notification to all admins
    try {
      const adminUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"));

      for (const admin of adminUsers) {
        await sendEmail({
          to: admin.email,
          subject: "New Live Chat Request",
          template: EMAIL_TEMPLATES.NEW_CHAT_REQUEST,
          data: {
            userName,
            userEmail: userEmail || "Not provided",
            sessionId,
            requestTime: new Date().toLocaleString(),
            adminChatLink: `https://lelekart.com/admin/chat`,
          },
        });
      }
    } catch (emailError) {
      console.error("Error sending admin notification:", emailError);
    }

    // Send WebSocket notification to all admins
    console.log("Calling sendNewChatSessionNotification WebSocket function");
    sendNewChatSessionNotification(session[0]);

    res.status(201).json(session[0]);
  } catch (error) {
    console.error("Error creating chat session:", error);
    res.status(500).json({ error: "Failed to create chat session" });
  }
}

// Get all chat sessions (for admin)
export async function getChatSessions(req: Request, res: Response) {
  try {
    const sessions = await db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.updatedAt));

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    res.status(500).json({ error: "Failed to fetch chat sessions" });
  }
}

// Get a specific chat session with messages
export async function getChatSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    const session = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt));

    res.json({
      session: session[0],
      messages,
    });
  } catch (error) {
    console.error("Error fetching chat session:", error);
    res.status(500).json({ error: "Failed to fetch chat session" });
  }
}

// Send a message in a chat session
export async function sendChatMessageHandler(req: Request, res: Response) {
  try {
    const { sessionId, message, senderType, senderName, senderId } = req.body;

    if (!sessionId || !message || !senderType || !senderName) {
      return res.status(400).json({
        error: "Session ID, message, sender type, and sender name are required",
      });
    }

    // Check if session exists
    const session = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    const messageId = uuidv4();
    const newMessage = await db
      .insert(chatMessages)
      .values({
        id: messageId,
        sessionId,
        senderType,
        senderId: senderId || null,
        senderName,
        message,
        isRead: false,
      })
      .returning();

    // Update session's updated_at timestamp
    await db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));

    // Send WebSocket notification to all participants in the chat session
    console.log("Calling sendChatMessage WebSocket function");
    sendChatMessage(sessionId, newMessage[0]);

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error("Error sending chat message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
}

// Close a chat session
export async function closeChatSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { closedBy } = req.body;

    const session = await db
      .update(chatSessions)
      .set({
        status: "closed",
        closedAt: new Date(),
        closedBy: closedBy || null,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, sessionId))
      .returning();

    if (session.length === 0) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    res.json(session[0]);
  } catch (error) {
    console.error("Error closing chat session:", error);
    res.status(500).json({ error: "Failed to close chat session" });
  }
}

// Mark messages as read
export async function markMessagesAsRead(req: Request, res: Response) {
  try {
    const { sessionId, messageIds } = req.body;

    if (!sessionId || !messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        error: "Session ID and message IDs array are required",
      });
    }

    // Mark specific messages as read
    for (const messageId of messageIds) {
      await db
        .update(chatMessages)
        .set({ isRead: true })
        .where(eq(chatMessages.id, messageId));
    }

    // Mark session as read if all messages are read
    const unreadMessages = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.sessionId, sessionId),
          eq(chatMessages.isRead, false)
        )
      );

    if (unreadMessages.length === 0) {
      await db
        .update(chatSessions)
        .set({ isRead: true })
        .where(eq(chatSessions.id, sessionId));
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
}

// Get unread chat count for admin
export async function getUnreadChatCount(req: Request, res: Response) {
  try {
    const unreadSessions = await db
      .select()
      .from(chatSessions)
      .where(
        and(eq(chatSessions.status, "open"), eq(chatSessions.isRead, false))
      );

    res.json({ count: unreadSessions.length });
  } catch (error) {
    console.error("Error getting unread chat count:", error);
    res.status(500).json({ error: "Failed to get unread chat count" });
  }
}
