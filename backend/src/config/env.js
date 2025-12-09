import dotenv from "dotenv";

dotenv.config();

const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),

  // Database
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/mydb",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",
  logPretty: process.env.LOG_PRETTY === "true",

  // Computed
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};

// Validation
if (!config.mongoUri) {
  throw new Error("MONGO_URI is required");
}

if (
  !config.jwtSecret ||
  config.jwtSecret === "your-secret-key-change-in-production"
) {
  console.warn(
    "WARNING: Using default JWT secret. Please set JWT_SECRET in production!"
  );
}

export default config;
