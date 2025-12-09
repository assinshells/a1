import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/env.js";
import { appLogger, httpLogger } from "./config/logger.js";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Подключение к базе данных
connectDB().catch((err) => {
  appLogger.fatal({ err }, "Failed to connect to database");
  process.exit(1);
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// HTTP request logging (morgan для базового логирования)
if (config.isDevelopment) {
  app.use(
    morgan("dev", {
      stream: {
        write: (message) => httpLogger.info(message.trim()),
      },
    })
  );
}

// Custom request logger (расширенное логирование)
app.use(requestLogger);

// Routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Chat Application Backend",
    version: "1.0.0",
    environment: config.nodeEnv,
  });
});

// 404 handler (должен быть после всех маршрутов)
app.use(notFound);

// Error handler (должен быть последним)
app.use(errorHandler);

export default app;
