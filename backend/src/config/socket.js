// backend/src/config/socket.js
import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { serverLogger } from "./logger.js";
import config from "./env.js";

// ✅ ИСПРАВЛЕНО: Структура для отслеживания пользователей
const activeUsers = new Map(); // userId -> { socketId, username, rooms: Set }
const roomUsers = new Map();   // roomName -> Set<userId>

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

    serverLogger.info({ userId, username, socketId: socket.id }, "User connected");

    // ✅ ИСПРАВЛЕНО: Инициализация пользователя
    activeUsers.set(userId, {
      socketId: socket.id,
      username,
      rooms: new Set(["general"]),
    });

    // ✅ Добавляем в комнату general
    socket.join("general");
    addUserToRoom("general", userId);

    await User.findByIdAndUpdate(userId, {
      status: "online",
      lastSeen: new Date(),
    });

    // ✅ ИСПРАВЛЕНО: Отправляем статистику
    socket.emit("connected", {
      userId,
      username,
      activeUsers: getActiveUsersList(),
      roomStats: getRoomStats(),
    });

    // ✅ Уведомляем всех о новом пользователе
    socket.broadcast.emit("user:online", { 
      userId, 
      username,
      totalOnline: activeUsers.size,
      roomStats: getRoomStats(),
    });

    // ✅ ИСПРАВЛЕНО: room:join с валидацией
    socket.on("room:join", (roomName) => {
      if (typeof roomName !== "string" || !roomName.trim()) {
        serverLogger.warn({ userId, roomName }, "Invalid room name");
        socket.emit("room:error", { error: "Invalid room name" });
        return;
      }

      const normalizedRoom = roomName.trim();
      socket.join(normalizedRoom);

      const userData = activeUsers.get(userId);
      if (userData) {
        userData.rooms.add(normalizedRoom);
      }

      addUserToRoom(normalizedRoom, userId);

      serverLogger.info({ userId, room: normalizedRoom }, "User joined room");

      // ✅ Уведомляем комнату
      io.to(normalizedRoom).emit("user:joined", {
        userId,
        username,
        room: normalizedRoom,
        roomStats: getRoomStats(),
      });
    });

    // ✅ ИСПРАВЛЕНО: room:leave
    socket.on("room:leave", (roomName) => {
      socket.leave(roomName);

      const userData = activeUsers.get(userId);
      if (userData) {
        userData.rooms.delete(roomName);
      }

      removeUserFromRoom(roomName, userId);

      serverLogger.info({ userId, roomName }, "User left room");

      socket.to(roomName).emit("user:left", {
        userId,
        username,
        room: roomName,
        roomStats: getRoomStats(),
      });
    });

    // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Отправка сообщений
    socket.on("message:send", async (data) => {
      try {
        const { receiver, room, content, type } = data;

        if (!content || !content.trim()) {
          socket.emit("message:error", { error: "Message content is required" });
          return;
        }

        // Создаём сообщение
        const message = await Message.create({
          sender: userId,
          receiver: receiver || null,
          room: room || "general",
          content: content.trim(),
          type: type || "text",
        });

        await message.populate("sender", "username status");
        if (message.receiver) {
          await message.populate("receiver", "username status");
        }

        // ✅ УНИФИЦИРОВАННАЯ структура
        const messageData = {
          _id: message._id.toString(),
          sender: {
            id: message.sender._id.toString(),
            username: message.sender.username,
            avatar: message.sender.avatar,
            status: message.sender.status,
          },
          receiver: message.receiver ? {
            id: message.receiver._id.toString(),
            username: message.receiver.username,
          } : null,
          room: message.room,
          content: message.content,
          type: message.type,
          isRead: message.isRead,
          isEdited: message.isEdited,
          createdAt: message.createdAt.toISOString(),
        };

        if (receiver) {
          // ✅ Приватное сообщение
          const receiverData = Array.from(activeUsers.entries()).find(
            ([id]) => id === receiver
          );

          if (receiverData) {
            io.to(receiverData[1].socketId).emit("message:receive", messageData);
          }

          // ✅ ИСПРАВЛЕНО: Отправляем подтверждение ТОЛЬКО отправителю
          socket.emit("message:sent", messageData);
        } else if (room) {
          // ✅ ИСПРАВЛЕНО: Отправляем message:receive ВСЕМ в комнате (включая отправителя)
          io.to(room).emit("message:receive", messageData);
        }

        serverLogger.info({ sender: userId, receiver, room, messageId: message._id }, "Message sent");
      } catch (error) {
        serverLogger.error({ error, userId }, "Error sending message");
        socket.emit("message:error", { error: "Failed to send message", details: error.message });
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
          io.to(receiverData[1].socketId).emit("typing:user", { userId, username });
        }
      } else if (room) {
        socket.to(room).emit("typing:user", { userId, username, room });
      }
    });

    socket.on("typing:stop", (data) => {
      const { receiver, room } = data;

      if (receiver) {
        const receiverData = Array.from(activeUsers.entries()).find(
          ([id]) => id === receiver
        );
        if (receiverData) {
          io.to(receiverData[1].socketId).emit("typing:stop", { userId, username });
        }
      } else if (room) {
        socket.to(room).emit("typing:stop", { userId, username, room });
      }
    });

    // ✅ ИСПРАВЛЕНО: disconnect с очисткой всех комнат
    socket.on("disconnect", async () => {
      serverLogger.info({ userId, username }, "User disconnected");

      const userData = activeUsers.get(userId);
      if (userData) {
        // Удаляем из всех комнат
        userData.rooms.forEach(room => {
          removeUserFromRoom(room, userId);
        });
      }

      activeUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        status: "offline",
        lastSeen: new Date(),
      });

      socket.broadcast.emit("user:offline", {
        userId,
        username,
        totalOnline: activeUsers.size,
        roomStats: getRoomStats(),
      });
    });

    socket.on("error", (error) => {
      serverLogger.error({ error, userId }, "Socket error");
    });
  });

  serverLogger.info("Socket.IO initialized");
  return io;
};

// ✅ НОВЫЕ ФУНКЦИИ: Управление пользователями в комнатах
function addUserToRoom(roomName, userId) {
  if (!roomUsers.has(roomName)) {
    roomUsers.set(roomName, new Set());
  }
  roomUsers.get(roomName).add(userId);
}

function removeUserFromRoom(roomName, userId) {
  const users = roomUsers.get(roomName);
  if (users) {
    users.delete(userId);
    if (users.size === 0) {
      roomUsers.delete(roomName);
    }
  }
}

function getRoomStats() {
  const stats = {};
  roomUsers.forEach((users, room) => {
    stats[room] = users.size;
  });
  return stats;
}

export const getActiveUsers = () => {
  return Array.from(activeUsers.entries()).map(([userId, data]) => ({
    userId,
    username: data.username,
    rooms: Array.from(data.rooms),
  }));
};

export const getActiveUsersList = () => {
  return Array.from(activeUsers.entries()).map(([userId, data]) => ({
    userId,
    username: data.username,
  }));
};

export const getRoomUserCount = (roomName) => {
  return roomUsers.get(roomName)?.size || 0;
};

export const getTotalOnlineUsers = () => {
  return activeUsers.size;
};

export default initializeSocket;