import pino from "pino";
import config from "./env.js";

// Базовая конфигурация логгера
const baseConfig = {
  level: config.logLevel,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Конфигурация для development (красивый вывод)
const devConfig = {
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss Z",
      ignore: "pid,hostname",
      singleLine: false,
    },
  },
};

// Создаем логгеры
const pinoConfig =
  config.isDevelopment && config.logPretty
    ? { ...baseConfig, ...devConfig }
    : baseConfig;

// Основной логгер
export const logger = pino(pinoConfig);

// Специализированные логгеры
export const serverLogger = logger.child({ module: "server" });
export const dbLogger = logger.child({ module: "database" });
export const appLogger = logger.child({ module: "app" });
export const httpLogger = logger.child({ module: "http" });

// Обработка необработанных исключений и отклонений промисов
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught Exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ reason, promise }, "Unhandled Rejection at Promise");
  process.exit(1);
});

export default logger;
