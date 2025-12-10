import mongoose from "mongoose";
import { dbLogger } from "./logger.js";
import config from "./env.js";

const connectDB = async (retries = 5) => {
  try {
    dbLogger.info(
      { uri: config.mongoUri.replace(/\/\/.*@/, "//<credentials>@") },
      "Attempting to connect to MongoDB"
    );

    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000, // Увеличен таймаут до 10 секунд
      socketTimeoutMS: 45000,
    });

    dbLogger.info(
      {
        host: conn.connection.host,
        port: conn.connection.port,
        name: conn.connection.name,
      },
      "MongoDB connected successfully"
    );

    // Connection event handlers
    mongoose.connection.on("connected", () => {
      dbLogger.debug("Mongoose connected to database");
    });

    mongoose.connection.on("error", (err) => {
      dbLogger.error({ err }, "Mongoose connection error");
    });

    mongoose.connection.on("disconnected", () => {
      dbLogger.warn("Mongoose disconnected");
    });

    return conn;
  } catch (err) {
    dbLogger.error(
      {
        err,
        retries: retries - 1,
        uri: config.mongoUri.replace(/\/\/.*@/, "//<credentials>@"),
      },
      "Error connecting to MongoDB"
    );

    // Retry logic
    if (retries > 0) {
      dbLogger.info(`Retrying connection... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      return connectDB(retries - 1);
    }

    // Если все попытки исчерпаны
    dbLogger.fatal("Failed to connect to MongoDB after all retries");
    dbLogger.error("\n=================================");
    dbLogger.error("MongoDB Connection Failed!");
    dbLogger.error("=================================");
    dbLogger.error("Please ensure MongoDB is running:");
    dbLogger.error("  - For local MongoDB: Start the MongoDB service");
    dbLogger.error("  - For Docker: Run 'docker-compose up -d'");
    dbLogger.error(
      "  - For Atlas: Check your connection string and IP whitelist"
    );
    dbLogger.error("=================================\n");

    throw err;
  }
};

// Graceful shutdown
export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    dbLogger.info("MongoDB connection closed");
  } catch (err) {
    dbLogger.error({ err }, "Error closing MongoDB connection");
    throw err;
  }
};

export default connectDB;
