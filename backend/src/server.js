import { createServer } from "http";
import app from "./app.js";
import config from "./config/env.js";
import { serverLogger } from "./config/logger.js";
import { closeDB } from "./config/db.js";
import { initializeSocket } from "./config/socket.js";

let server;
let io;

/**
 * Запуск сервера
 */
const startServer = () => {
  // Создаем HTTP сервер
  const httpServer = createServer(app);

  // Инициализируем Socket.IO
  io = initializeSocket(httpServer);

  // Запускаем сервер
  server = httpServer.listen(config.port, () => {
    serverLogger.info(
      {
        port: config.port,
        env: config.nodeEnv,
        nodeVersion: process.version,
      },
      `Server started: http://localhost:${config.port}`
    );
    serverLogger.info("Socket.IO server is ready");
  });

  // Обработка ошибок сервера
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      serverLogger.error(
        { port: config.port },
        `Port ${config.port} is already in use`
      );
    } else {
      serverLogger.error({ error }, "Server error");
    }
    process.exit(1);
  });
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  serverLogger.info({ signal }, "Received shutdown signal");

  if (server) {
    // Закрываем Socket.IO соединения
    if (io) {
      io.close(() => {
        serverLogger.info("Socket.IO connections closed");
      });
    }

    // Закрываем HTTP сервер
    server.close(async () => {
      serverLogger.info("HTTP server closed");

      try {
        // Закрываем подключение к БД
        await closeDB();
        serverLogger.info("All connections closed successfully");
        process.exit(0);
      } catch (err) {
        serverLogger.error({ err }, "Error during shutdown");
        process.exit(1);
      }
    });

    // Принудительное завершение через 10 секунд
    setTimeout(() => {
      serverLogger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  }
};

// Обработчики сигналов завершения
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Запускаем сервер
startServer();
