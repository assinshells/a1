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

export default config;
