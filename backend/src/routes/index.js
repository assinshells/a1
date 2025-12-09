import express from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import authRoutes from "./authRoutes.js";
import messageRoutes from "./messageRoutes.js";

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
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      messages: "/api/messages",
    },
  });
});

// Тестовый async маршрут
router.get(
  "/test-async",
  asyncHandler(async (req, res) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    res.status(200).json({
      success: true,
      message: "Async operation completed",
      data: { test: true },
    });
  })
);

// Подключение маршрутов
router.use("/auth", authRoutes);
router.use("/messages", messageRoutes);

export default router;
