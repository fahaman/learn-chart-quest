import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db.js";
import authRoutes from "./routes/auth.js";
import tradeRoutes from "./routes/trade.js";
import adminRoutes from "./routes/admin.js";
import learnRoutes from "./routes/learn.js";
import userRoutes from "./routes/user.js";

import User from "./models/User.js";

dotenv.config();

const ensureAdmin = async () => {
  try {
    const adminEmail = "adminlearn@chart.com";
    const adminPassword = "Admin@2026";
    
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      console.log(`Admin account ${adminEmail} not found. Creating...`);
      await User.create({
        name: "Admin User",
        username: "admin",
        email: adminEmail,
        phone: "0000000000",
        password: adminPassword,
        role: "admin",
        cash_balance: 1000000
      });
      console.log(`Default admin created: ${adminEmail} / ${adminPassword}`);
    } else {
      // Ensure existing admin has the correct password and role
      admin.password = adminPassword;
      admin.role = "admin";
      await admin.save();
      console.log(`Admin account ${adminEmail} credentials synced.`);
    }
  } catch (err) {
    console.error("Error ensuring admin account:", err.message);
  }
};

await connectDB();
await ensureAdmin();

const app = express();
app.use(cors());
app.use(express.json());

// Main Routes
app.use("/api/auth", authRoutes);
app.use("/api/trade", tradeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/learn", learnRoutes);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => res.send("API is running..."));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
