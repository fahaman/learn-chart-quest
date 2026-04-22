import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || "learnchart_secret_123", { expiresIn: "30d" });

// Temporary in-memory store for OTPs (In production, use Redis or a DB)
const otpStore = new Map();

router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { otp, expires: Date.now() + 300000 }); // 5 min expiry

  console.log("-----------------------");
  console.log(`OTP for ${phone}: ${otp}`);
  console.log("-----------------------");

  res.json({ message: "OTP sent successfully (Check server console)" });
});

router.post("/register", async (req, res) => {
  const { name, username, email, phone, password, otp } = req.body;
  
  // Validations
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const usernameRegex = /^[a-zA-Z]+$/;
  const nameRegex = /^[a-zA-Z\s]+$/;
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  if (!name || !username || !email || !phone || !password || !otp) {
    return res.status(400).json({ error: "All fields including OTP are required" });
  }

  // Verify OTP
  const stored = otpStore.get(phone);
  if (!stored || stored.otp !== otp || stored.expires < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }
  otpStore.delete(phone); // Clear OTP after use

  if (name.length > 50 || !nameRegex.test(name)) {
    return res.status(400).json({ error: "Name should only contain letters and be max 50 characters" });
  }

  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: "Username should only contain letters (no numbers or symbols)" });
  }

  if (!gmailRegex.test(email)) {
    return res.status(400).json({ error: "Please provide a valid Gmail address (@gmail.com)" });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: "Password must be at least 8 characters long and contain at least one uppercase letter and one number" });
  }

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      if (userExists.email === email) {
        return res.status(400).json({ error: "Email already registered" });
      }
      return res.status(400).json({ error: "Username already taken" });
    }

    const user = await User.create({ name, username, email, phone, password });
    if (user) {
      res.status(201).json({
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        cash_balance: user.cash_balance,
        role: user.role,
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
  let { email, password } = req.body;
  email = email?.trim();
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        cash_balance: user.cash_balance,
        role: user.role,
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
    name: req.user.name,
    username: req.user.username,
    email: req.user.email,
    phone: req.user.phone,
    cash_balance: req.user.cash_balance,
    role: req.user.role,
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
