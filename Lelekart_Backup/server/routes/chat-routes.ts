import { Router } from "express";
import * as chatHandlers from "../handlers/chat-handlers";
import { authenticateToken } from "../auth";

const router = Router();

// Public routes (for users)
router.post("/sessions", chatHandlers.createChatSession);
router.get("/sessions/:sessionId", chatHandlers.getChatSession);
router.post("/messages", chatHandlers.sendChatMessageHandler);

// Admin routes (require authentication)
router.get("/admin/sessions", authenticateToken, chatHandlers.getChatSessions);
router.post(
  "/admin/sessions/:sessionId/close",
  authenticateToken,
  chatHandlers.closeChatSession
);
router.post(
  "/admin/messages/read",
  authenticateToken,
  chatHandlers.markMessagesAsRead
);
router.get(
  "/admin/unread-count",
  authenticateToken,
  chatHandlers.getUnreadChatCount
);

export default router;
