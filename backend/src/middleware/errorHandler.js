import { appLogger } from "../config/logger.js";
import config from "../config/env.js";

/**
 * Централизованный обработчик ошибок
 */
export const errorHandler = (err, req, res, next) => {
  // Логируем ошибку
  appLogger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      req: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
      },
    },
    "Application error"
  );

  // Определяем статус код
  const statusCode = err.statusCode || err.status || 500;

  // Формируем ответ
  const response = {
    success: false,
    message: err.message || "Внутренняя ошибка сервера",
    ...(config.isDevelopment && {
      stack: err.stack,
      error: err,
    }),
  };

  res.status(statusCode).json(response);
};

/**
 * Обработчик для async функций
 * Оборачивает async middleware/контроллеры для автоматической обработки ошибок
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default errorHandler;
