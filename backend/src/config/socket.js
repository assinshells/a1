// backend/src/config/socket.js
import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { serverLogger } from "./logger.js";
import config from "./env.js";

const activeUsers = new Map();

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Middleware для аутентификации
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = verifyToken(token);
      if (!decoded) return next(new Error("Invalid token"));

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return next(new Error("User not found or inactive"));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      serverLogger.error({ error }, "Socket authentication error");
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    const username = socket.username;

    serverLogger.info(
      { userId, username, socketId: socket.id },
      "User connected"
    );

    activeUsers.set(userId, {
      socketId: socket.id,
      username,
      rooms: new Set(["general"]),
    });

    await User.findByIdAndUpdate(userId, {
      status: "online",
      lastSeen: new Date(),
    });

    socket.join("general");

    socket.emit("connected", {
      userId,
      username,
      activeUsers: Array.from(activeUsers.entries()).map(([id, data]) => ({
        userId: id,
        username: data.username,
      })),
    });

    socket.broadcast.emit("user:online", { userId, username });

    // ✅ ИСПРАВЛЕНО: room:join теперь корректно обрабатывает строки
    socket.on("room:join", (roomName) => {
      if (typeof roomName !== "string" || !roomName.trim()) {
        serverLogger.warn({ userId, roomName }, "Invalid room name");
        return;
      }

      socket.join(roomName);
      const userData = activeUsers.get(userId);
      if (userData) {
        userData.rooms.add(roomName);
      }

      serverLogger.info({ userId, roomName }, "User joined room");

      socket.to(roomName).emit("user:joined", {
        userId,
        username,
        room: roomName,
      });
    });

    socket.on("room:leave", (roomName) => {
      socket.leave(roomName);
      const userData = activeUsers.get(userId);
      if (userData) {
        userData.rooms.delete(roomName);
      }

      serverLogger.info({ userId, roomName }, "User left room");

      socket.to(roomName).emit("user:left", {
        userId,
        username,
        room: roomName,
      });
    });

    // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Унифицированная структура сообщения
    socket.on("message:send", async (data) => {
      try {
        const { receiver, room, content, type } = data;

        // Валидация
        if (!content || !content.trim()) {
          socket.emit("message:error", {
            error: "Message content is required",
          });
          return;
        }

        // ✅ Создаём и сохраняем сообщение в БД
        const message = await Message.create({
          sender: userId,
          receiver: receiver || null,
          room: room || "general",
          content: content.trim(),
          type: type || "text",
        });

        // ✅ Populate для отправки клиентам
        await message.populate("sender", "username status");
        if (message.receiver) {
          await message.populate("receiver", "username status");
        }

        // ✅ УНИФИЦИРОВАННАЯ структура (БЕЗ timestamp, ТОЛЬКО createdAt)
        const messageData = {
          _id: message._id.toString(),
          sender: {
            id: message.sender._id.toString(),
            username: message.sender.username,
            avatar: message.sender.avatar,
            status: message.sender.status,
          },
          receiver: message.receiver
            ? {
                id: message.receiver._id.toString(),
                username: message.receiver.username,
              }
            : null,
          room: message.room,
          content: message.content,
          type: message.type,
          isRead: message.isRead,
          isEdited: message.isEdited,
          createdAt: message.createdAt.toISOString(), // ✅ ISO формат
        };

        if (receiver) {
          // Приватное сообщение
          const receiverData = Array.from(activeUsers.entries()).find(
            ([id]) => id === receiver
          );

          if (receiverData) {
            io.to(receiverData[1].socketId).emit(
              "message:receive",
              messageData
            );
          }

          socket.emit("message:sent", messageData);
        } else if (room) {
          // Сообщение в комнату (включая отправителя)
          io.to(room).emit("message:receive", messageData);
        }

        serverLogger.info(
          { sender: userId, receiver, room, messageId: message._id },
          "Message sent and saved"
        );
      } catch (error) {
        serverLogger.error({ error, userId }, "Error sending message");
        socket.emit("message:error", {
          error: "Failed to send message",
          details: error.message,
        });
      }
    });

    // ✅ Typing events (оптимизированы)
    socket.on("typing:start", (data) => {
      const { receiver, room } = data;

      if (receiver) {
        const receiverData = Array.from(activeUsers.entries()).find(
          ([id]) => id === receiver
        );
        if (receiverData) {
          io.to(receiverData[1].socketId).emit("typing:user", {
            userId,
            username,
          });
        }
      } else if (room) {
        socket.to(room).emit("typing:user", {
          userId,
          username,
          room,
        });
      }
    });

    socket.on("typing:stop", (data) => {
      const { receiver, room } = data;

      if (receiver) {
        const receiverData = Array.from(activeUsers.entries()).find(
          ([id]) => id === receiver
        );
        if (receiverData) {
          io.to(receiverData[1].socketId).emit("typing:stop", {
            userId,
            username,
          });
        }
      } else if (room) {
        socket.to(room).emit("typing:stop", {
          userId,
          username,
          room,
        });
      }
    });

    socket.on("disconnect", async () => {
      serverLogger.info({ userId, username }, "User disconnected");

      activeUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        status: "offline",
        lastSeen: new Date(),
      });

      socket.broadcast.emit("user:offline", {
        userId,
        username,
      });
    });

    socket.on("error", (error) => {
      serverLogger.error({ error, userId }, "Socket error");
    });
  });

  serverLogger.info("Socket.IO initialized");

  return io;
};

export const getActiveUsers = () => {
  return Array.from(activeUsers.entries()).map(([userId, data]) => ({
    userId,
    username: data.username,
    rooms: Array.from(data.rooms),
  }));
};

export default initializeSocket;
