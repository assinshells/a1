import express from "express";
import * as messageController from "../controllers/messageController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createMessageSchema,
  editMessageSchema,
  getMessagesSchema,
} from "../validation/schemas.js";

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

/**
 * @route   GET /api/messages
 * @desc    Get messages (with filters)
 * @access  Private
 */
router.get(
  "/",
  validate(getMessagesSchema, "query"),
  messageController.getMessages
);

/**
 * @route   POST /api/messages
 * @desc    Create new message
 * @access  Private
 */
router.post(
  "/",
  validate(createMessageSchema),
  messageController.createMessage
);

/**
 * @route   GET /api/messages/:id
 * @desc    Get specific message
 * @access  Private
 */
router.get("/:id", messageController.getMessage);

/**
 * @route   PATCH /api/messages/:id
 * @desc    Edit message
 * @access  Private
 */
router.patch(
  "/:id",
  validate(editMessageSchema),
  messageController.editMessage
);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete message
 * @access  Private
 */
router.delete("/:id", messageController.deleteMessage);

/**
 * @route   PATCH /api/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.patch("/:id/read", messageController.markAsRead);

export default router;
