import crypto from "crypto";
import User from "../models/User.js";
import { generateToken, generateRefreshToken } from "../utils/jwt.js";
import { appLogger } from "../config/logger.js";
import emailService from "../services/emailService.js";

/**
 * Регистрация нового пользователя
 * Email теперь опционален
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ✅ ДОБАВЛЕНО: Детальное логирование
    appLogger.info(
      { username, email: email ? "provided" : "empty" },
      "Registration attempt"
    );

    // ✅ ДОБАВЛЕНО: Валидация пароля
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Проверяем существование пользователя по username
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already taken",
      });
    }

    // Если email указан, проверяем его уникальность
    if (email && email.trim()) {
      const existingUserByEmail = await User.findOne({ email: email.trim() });
      if (existingUserByEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }
    }

    // ✅ ИСПРАВЛЕНО: Более надёжное создание userData
    const userData = {
      username: username.trim(),
      password: password, // Хеширование произойдёт в pre-save hook
    };

    // Добавляем email только если он указан и не пустой
    if (email && email.trim()) {
      userData.email = email.trim().toLowerCase();
    }

    // ✅ ДОБАВЛЕНО: Проверка перед созданием
    appLogger.debug(
      { userData: { ...userData, password: "[HIDDEN]" } },
      "Creating user"
    );

    // Создаем пользователя
    const user = await User.create(userData);

    // ✅ ДОБАВЛЕНО: Проверка успешного создания
    if (!user) {
      throw new Error("User creation failed");
    }

    // Генерируем токены
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    appLogger.info(
      { userId: user._id, username },
      "User registered successfully"
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: user.toPublicJSON(),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    // ✅ УЛУЧШЕНО: Более детальное логирование ошибок
    appLogger.error(
      {
        error: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      },
      "Registration error"
    );

    // ✅ ДОБАВЛЕНО: Обработка специфичных ошибок Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * Вход пользователя
 * Можно войти используя username или email
 */
export const login = async (req, res) => {
  try {
    const { login, email, username, password } = req.body;

    // Определяем идентификатор для поиска
    const identifier = login || email || username;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Username or email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // Ищем пользователя по email или username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Проверяем активность аккаунта
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Проверяем пароль
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Обновляем статус и время последнего посещения
    user.status = "online";
    user.lastSeen = new Date();
    await user.save();

    // Генерируем токены
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    appLogger.info({ userId: user._id, username: user.username }, "User login");

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toPublicJSON(),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    appLogger.error({ error }, "Login error");
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

/**
 * Запрос на сброс пароля
 */
export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;

    // Ищем пользователя по email или username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      // Из соображений безопасности возвращаем успех даже если пользователь не найден
      return res.status(200).json({
        success: true,
        message: "If the account exists, a password reset link has been sent",
      });
    }

    // Проверяем, есть ли у пользователя email
    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: "Cannot reset password: no email associated with this account",
      });
    }

    // Генерируем токен сброса
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Отправляем email (в dev режиме - логируем)
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);

      appLogger.info(
        { userId: user._id, email: user.email },
        "Password reset requested"
      );

      res.status(200).json({
        success: true,
        message: "Password reset link has been sent to your email",
      });
    } catch (emailError) {
      // Если не удалось отправить email, очищаем токен
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      appLogger.error({ error: emailError }, "Failed to send reset email");

      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later.",
      });
    }
  } catch (error) {
    appLogger.error({ error }, "Forgot password error");
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
      error: error.message,
    });
  }
};

/**
 * Сброс пароля по токену
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Хешируем токен для поиска
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Ищем пользователя с валидным токеном
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Устанавливаем новый пароль
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    appLogger.info({ userId: user._id }, "Password reset successful");

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    appLogger.error({ error }, "Reset password error");
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};

/**
 * Выход пользователя
 */
export const logout = async (req, res) => {
  try {
    const user = req.user;

    user.status = "offline";
    user.lastSeen = new Date();
    await user.save();

    appLogger.info(
      { userId: user._id, username: user.username },
      "User logout"
    );

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    appLogger.error({ error }, "Logout error");
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
  }
};

/**
 * Получение текущего пользователя
 */
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user.toPublicJSON(),
      },
    });
  } catch (error) {
    appLogger.error({ error }, "Get me error");
    res.status(500).json({
      success: false,
      message: "Failed to get user data",
      error: error.message,
    });
  }
};

/**
 * Обновление профиля
 */
export const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;

    // Проверяем уникальность username если он изменяется
    if (updates.username && updates.username !== user.username) {
      const existingUser = await User.findOne({ username: updates.username });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Username already taken",
        });
      }
    }

    // Проверяем уникальность email если он изменяется
    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({ email: updates.email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }
    }

    // Применяем обновления
    Object.keys(updates).forEach((key) => {
      if (key !== "password") {
        user[key] = updates[key];
      }
    });

    await user.save();

    appLogger.info({ userId: user._id, updates }, "Profile updated");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: user.toPublicJSON(),
      },
    });
  } catch (error) {
    appLogger.error({ error }, "Update profile error");
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

/**
 * Смена пароля
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    appLogger.info({ userId: user._id }, "Password changed");

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    appLogger.error({ error }, "Change password error");
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};

export default {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
