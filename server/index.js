import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db.js";
import authRoutes from "./routes/auth.js";
import tradeRoutes from "./routes/trade.js";
import adminRoutes from "./routes/admin.js";
import learnRoutes from "./routes/learn.js";

dotenv.config(); // Loads .env from the project root directory

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Main Routes
app.use("/api/auth", authRoutes);
app.use("/api/trade", tradeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/learn", learnRoutes);

app.get("/", (req, res) => res.send("API is running..."));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
