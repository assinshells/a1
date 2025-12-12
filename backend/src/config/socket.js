// backend/src/config/socket.js
import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { serverLogger } from "./logger.js";
import config from "./env.js";

const activeUsers = new Map();
const roomUsers = new Map();

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

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

    // ✅ ИСПРАВЛЕНО: НЕ присоединяем автоматически к general
    activeUsers.set(userId, {
      socketId: socket.id,
      username,
      rooms: new Set(),
    });

    await User.findByIdAndUpdate(userId, {
      status: "online",
      lastSeen: new Date(),
    });

    const currentStats = getRoomStats();
    const totalUsers = activeUsers.size;

    // ✅ Отправляем текущему пользователю его данные
    socket.emit("connected", {
      userId,
      username,
      activeUsers: getActiveUsersList(),
      roomStats: currentStats,
      totalOnline: totalUsers,
    });

    // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Уведомляем ВСЕХ о новом пользователе
    io.emit("stats:update", {
      roomStats: currentStats,
      totalOnline: totalUsers,
      event: 'user:online',
      userId,
      username
    });

    // ✅ room:join
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

      const newStats = getRoomStats();
      const totalUsers = activeUsers.size;

      serverLogger.info({ 
        userId, 
        room: normalizedRoom, 
        roomCount: newStats[normalizedRoom],
        totalOnline: totalUsers,
        allStats: newStats
      }, "User joined room");

      // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Отправляем ВСЕМ пользователям (не только в комнате)
      io.emit("stats:update", {
        roomStats: newStats,
        totalOnline: totalUsers,
        event: 'user:joined',
        room: normalizedRoom,
        userId,
        username
      });
    });

    // ✅ room:leave
    socket.on("room:leave", (roomName) => {
      socket.leave(roomName);

      const userData = activeUsers.get(userId);
      if (userData) {
        userData.rooms.delete(roomName);
      }

      removeUserFromRoom(roomName, userId);

      const newStats = getRoomStats();
      const totalUsers = activeUsers.size;

      serverLogger.info({ 
        userId, 
        roomName, 
        roomCount: newStats[roomName] || 0,
        totalOnline: totalUsers,
        allStats: newStats
      }, "User left room");

      // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Отправляем ВСЕМ пользователям
      io.emit("stats:update", {
        roomStats: newStats,
        totalOnline: totalUsers,
        event: 'user:left',
        room: roomName,
        userId,
        username
      });
    });

    // ✅ message:send
    socket.on("message:send", async (data) => {
      try {
        const { receiver, room, content, type } = data;

        if (!content || !content.trim()) {
          socket.emit("message:error", { error: "Message content is required" });
          return;
        }

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
          const receiverData = Array.from(activeUsers.entries()).find(
            ([id]) => id === receiver
          );

          if (receiverData) {
            io.to(receiverData[1].socketId).emit("message:receive", messageData);
          }

          socket.emit("message:sent", messageData);
        } else if (room) {
          io.to(room).emit("message:receive", messageData);
        }

        serverLogger.info({ sender: userId, receiver, room, messageId: message._id }, "Message sent");
      } catch (error) {
        serverLogger.error({ error, userId }, "Error sending message");
        socket.emit("message:error", { error: "Failed to send message", details: error.message });
      }
    });

    // ✅ Typing events
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

    // ✅ disconnect
    socket.on("disconnect", async () => {
      serverLogger.info({ userId, username }, "User disconnected");

      const userData = activeUsers.get(userId);
      if (userData) {
        // ✅ Удаляем пользователя из всех комнат
        userData.rooms.forEach(room => {
          removeUserFromRoom(room, userId);
        });
      }

      activeUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        status: "offline",
        lastSeen: new Date(),
      });

      const newStats = getRoomStats();
      const totalUsers = activeUsers.size;

      serverLogger.info({
        userId,
        totalOnline: totalUsers,
        remainingStats: newStats
      }, "User fully disconnected");

      // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Уведомляем ВСЕХ об отключении
      io.emit("stats:update", {
        roomStats: newStats,
        totalOnline: totalUsers,
        event: 'user:offline',
        userId,
        username
      });
    });

    socket.on("error", (error) => {
      serverLogger.error({ error, userId }, "Socket error");
    });
  });

  serverLogger.info("Socket.IO initialized");
  return io;
};

// ✅ Утилиты
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