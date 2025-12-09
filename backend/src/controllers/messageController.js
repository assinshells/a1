import Message from "../models/Message.js";
import { appLogger } from "../config/logger.js";

/**
 * Создание нового сообщения
 */
export const createMessage = async (req, res) => {
  try {
    const { receiver, room, content, type, attachments } = req.body;
    const sender = req.user._id;

    const message = await Message.create({
      sender,
      receiver: receiver || null,
      room: room || "general",
      content,
      type: type || "text",
      attachments: attachments || [],
    });

    // Populate sender info
    await message.populate("sender", "username avatar status");
    if (message.receiver) {
      await message.populate("receiver", "username avatar status");
    }

    appLogger.info(
      {
        messageId: message._id,
        sender,
        receiver,
        room,
      },
      "Message created"
    );

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: { message },
    });
  } catch (error) {
    appLogger.error({ error }, "Create message error");
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

/**
 * Получение сообщений
 */
export const getMessages = async (req, res) => {
  try {
    const { targetId, room, limit = 50, skip = 0 } = req.query;
    const userId = req.user._id;

    let messages;

    if (targetId) {
      // Приватные сообщения с конкретным пользователем
      messages = await Message.getChatHistory(userId, targetId, limit, skip);
    } else if (room) {
      // Сообщения из комнаты
      messages = await Message.getRoomMessages(room, limit, skip);
    } else {
      // Все сообщения пользователя
      messages = await Message.find({
        $or: [{ sender: userId }, { receiver: userId }],
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .populate("sender", "username avatar status")
        .populate("receiver", "username avatar status");
    }

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(), // Сортируем в хронологическом порядке
        count: messages.length,
      },
    });
  } catch (error) {
    appLogger.error({ error }, "Get messages error");
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
      error: error.message,
    });
  }
};

/**
 * Получение конкретного сообщения
 */
export const getMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id)
      .populate("sender", "username avatar status")
      .populate("receiver", "username avatar status");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Проверка прав доступа
    const hasAccess =
      message.sender._id.toString() === userId.toString() ||
      (message.receiver &&
        message.receiver._id.toString() === userId.toString()) ||
      !message.receiver; // Публичное сообщение

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: { message },
    });
  } catch (error) {
    appLogger.error({ error }, "Get message error");
    res.status(500).json({
      success: false,
      message: "Failed to get message",
      error: error.message,
    });
  }
};

/**
 * Редактирование сообщения
 */
export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Проверка владельца
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages",
      });
    }

    // Редактируем сообщение
    await message.edit(content);
    await message.populate("sender", "username avatar status");

    appLogger.info({ messageId: id, userId }, "Message edited");

    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: { message },
    });
  } catch (error) {
    appLogger.error({ error }, "Edit message error");
    res.status(500).json({
      success: false,
      message: "Failed to edit message",
      error: error.message,
    });
  }
};

/**
 * Удаление сообщения
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Проверка владельца
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    // Мягкое удаление
    await message.softDelete();

    appLogger.info({ messageId: id, userId }, "Message deleted");

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    appLogger.error({ error }, "Delete message error");
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};

/**
 * Пометка сообщения как прочитанного
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Проверка получателя
    if (
      !message.receiver ||
      message.receiver.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only mark messages sent to you as read",
      });
    }

    await message.markAsRead();

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: { message },
    });
  } catch (error) {
    appLogger.error({ error }, "Mark as read error");
    res.status(500).json({
      success: false,
      message: "Failed to mark message as read",
      error: error.message,
    });
  }
};

export default {
  createMessage,
  getMessages,
  getMessage,
  editMessage,
  deleteMessage,
  markAsRead,
};
