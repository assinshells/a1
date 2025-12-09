import mongoose from "mongoose";
import { dbLogger } from "./logger.js";
import config from "./env.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
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
    dbLogger.error({ err }, "Error connecting to MongoDB");
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
