import { httpLogger } from "../config/logger.js";

/**
 * Middleware для логирования HTTP запросов
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Логируем входящий запрос
  httpLogger.info(
    {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
    },
    "Incoming request"
  );

  // Перехватываем завершение ответа
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;

    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("content-length"),
    };

    if (res.statusCode >= 500) {
      httpLogger.error(logData, "Request completed with error");
    } else if (res.statusCode >= 400) {
      httpLogger.warn(logData, "Request completed with client error");
    } else {
      httpLogger.info(logData, "Request completed");
    }

    return originalSend.call(this, data);
  };

  next();
};

export default requestLogger;
