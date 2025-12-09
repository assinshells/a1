import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { serverLogger } from "./logger.js";
import config from "./env.js";

// Хранилище активных пользователей
const activeUsers = new Map();

/**
 * Инициализация Socket.IO
 */
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

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        return next(new Error("Invalid token"));
      }

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

  // Обработка подключений
  io.on("connection", async (socket) => {
    const userId = socket.userId;
    const username = socket.username;

    serverLogger.info(
      { userId, username, socketId: socket.id },
      "User connected"
    );

    // Добавляем пользователя в активные
    activeUsers.set(userId, {
      socketId: socket.id,
      username,
      rooms: new Set(["general"]),
    });

    // Обновляем статус пользователя
    await User.findByIdAndUpdate(userId, {
      status: "online",
      lastSeen: new Date(),
    });

    // Присоединяем к комнате по умолчанию
    socket.join("general");

    // Отправляем информацию о подключении
    socket.emit("connected", {
      userId,
      username,
      activeUsers: Array.from(activeUsers.entries()).map(([id, data]) => ({
        userId: id,
        username: data.username,
      })),
    });

    // Оповещаем других о новом пользователе
    socket.broadcast.emit("user:online", {
      userId,
      username,
    });

    // Обработка присоединения к комнате
    socket.on("room:join", (roomName) => {
      socket.join(roomName);
      activeUsers.get(userId).rooms.add(roomName);

      serverLogger.info({ userId, roomName }, "User joined room");

      socket.to(roomName).emit("user:joined", {
        userId,
        username,
        room: roomName,
      });
    });

    // Обработка выхода из комнаты
    socket.on("room:leave", (roomName) => {
      socket.leave(roomName);
      activeUsers.get(userId).rooms.delete(roomName);

      serverLogger.info({ userId, roomName }, "User left room");

      socket.to(roomName).emit("user:left", {
        userId,
        username,
        room: roomName,
      });
    });

    // Обработка отправки сообщения
    socket.on("message:send", (data) => {
      const { receiver, room, content, type } = data;

      const messageData = {
        sender: userId,
        senderUsername: username,
        receiver,
        room: room || "general",
        content,
        type: type || "text",
        timestamp: new Date(),
      };

      if (receiver) {
        // Приватное сообщение
        const receiverData = Array.from(activeUsers.entries()).find(
          ([id]) => id === receiver
        );

        if (receiverData) {
          io.to(receiverData[1].socketId).emit("message:receive", messageData);
        }

        // Отправляем обратно отправителю
        socket.emit("message:sent", messageData);
      } else if (room) {
        // Сообщение в комнату
        io.to(room).emit("message:receive", messageData);
      }

      serverLogger.info(
        {
          sender: userId,
          receiver,
          room,
        },
        "Message sent"
      );
    });

    // Обработка события "печатает"
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

    // Обработка события "перестал печатать"
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

    // Обработка отключения
    socket.on("disconnect", async () => {
      serverLogger.info({ userId, username }, "User disconnected");

      // Удаляем из активных пользователей
      activeUsers.delete(userId);

      // Обновляем статус пользователя
      await User.findByIdAndUpdate(userId, {
        status: "offline",
        lastSeen: new Date(),
      });

      // Оповещаем других об отключении
      socket.broadcast.emit("user:offline", {
        userId,
        username,
      });
    });

    // Обработка ошибок
    socket.on("error", (error) => {
      serverLogger.error({ error, userId }, "Socket error");
    });
  });

  serverLogger.info("Socket.IO initialized");

  return io;
};

/**
 * Получение активных пользователей
 */
export const getActiveUsers = () => {
  return Array.from(activeUsers.entries()).map(([userId, data]) => ({
    userId,
    username: data.username,
    rooms: Array.from(data.rooms),
  }));
};

export default initializeSocket;
