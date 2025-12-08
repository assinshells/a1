import express from "express";
import cors from "cors";
import "./config/db.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

export default app;
