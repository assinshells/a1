import User from "../models/User.js";
import { generateToken, generateRefreshToken } from "../utils/jwt.js";
import { appLogger } from "../config/logger.js";

/**
 * Регистрация нового пользователя
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Проверяем существование пользователя
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    // Создаем пользователя
    const user = await User.create({
      username,
      email,
      password,
    });

    // Генерируем токены
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    appLogger.info({ userId: user._id, username }, "User registered");

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
    appLogger.error({ error }, "Registration error");
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

/**
 * Вход пользователя
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Находим пользователя и включаем пароль
    const user = await User.findOne({ email }).select("+password");

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
 * Выход пользователя
 */
export const logout = async (req, res) => {
  try {
    const user = req.user;

    // Обновляем статус
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

    // Применяем обновления
    Object.keys(updates).forEach((key) => {
      user[key] = updates[key];
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

    // Проверяем текущий пароль
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Устанавливаем новый пароль
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
};
