import express from "express";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Chat Application API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      messages: "/api/messages (coming soon)",
    },
  });
});

// Пример защищённого маршрута с обработкой ошибок
router.get(
  "/test-error",
  asyncHandler(async (req, res) => {
    // Симуляция ошибки для тестирования
    throw new Error("Это тестовая ошибка");
  })
);

// Пример async маршрута
router.get(
  "/test-async",
  asyncHandler(async (req, res) => {
    // Симуляция асинхронной операции
    await new Promise((resolve) => setTimeout(resolve, 100));

    res.status(200).json({
      success: true,
      message: "Async operation completed",
      data: { test: true },
    });
  })
);

export default router;
