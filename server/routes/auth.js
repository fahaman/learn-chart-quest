import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || "learnchart_secret_123", { expiresIn: "30d" });

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: "User already exists" });

    const user = await User.create({ email, password });
    if (user) {
      res.status(201).json({
        id: user._id,
        email: user.email,
        cash_balance: user.cash_balance,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        id: user._id,
        email: user.email,
        cash_balance: user.cash_balance,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", protect, async (req, res) => {
  res.json({
    id: req.user._id,
    email: req.user.email,
    cash_balance: req.user.cash_balance,
  });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({ message: "If a user with that email exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password/${resetToken}`;
    
    // For now, log the reset URL to console since nodemailer isn't installed
    console.log("-----------------------");
    console.log("PASSWORD RESET REQUEST");
    console.log(`Email: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("-----------------------");

    res.status(200).json({ message: "If a user with that email exists, a reset link has been sent." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Password reset token is invalid or has expired." });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
