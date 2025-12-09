import { verifyToken, extractToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { appLogger } from "../config/logger.js";

/**
 * Middleware для проверки аутентификации
 */
export const authenticate = async (req, res, next) => {
  try {
    // Извлекаем токен из заголовка
    const token = extractToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Верифицируем токен
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Проверяем существование пользователя
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // Добавляем пользователя в запрос
    req.user = user;
    next();
  } catch (error) {
    appLogger.error({ error }, "Authentication error");
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

/**
 * Опциональная аутентификация (не требует токена, но если он есть - проверяет)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);

      if (decoded) {
        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // В случае ошибки просто продолжаем без пользователя
    next();
  }
};

export default {
  authenticate,
  optionalAuth,
};
