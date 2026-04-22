import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
router.put("/profile", protect, async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    if (req.body.name) {
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (req.body.name.length > 50 || !nameRegex.test(req.body.name)) {
            return res.status(400).json({ error: "Name should only contain letters and be max 50 characters" });
        }
        user.name = req.body.name;
    }

    user.phone = req.body.phone || user.phone;
    
    // Username and Email are usually unique and not easily changed, 
    // but I'll allow it if they are valid and not taken.
    if (req.body.username && req.body.username !== user.username) {
        const usernameExists = await User.findOne({ username: req.body.username });
        if (usernameExists) {
            return res.status(400).json({ error: "Username already taken" });
        }
        const usernameRegex = /^[a-zA-Z]+$/;
        if (!usernameRegex.test(req.body.username)) {
            return res.status(400).json({ error: "Username should only contain letters" });
        }
        user.username = req.body.username;
    }

    if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
            return res.status(400).json({ error: "Email already registered" });
        }
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(req.body.email)) {
            return res.status(400).json({ error: "Please provide a valid Gmail address (@gmail.com)" });
        }
        user.email = req.body.email;
    }

    if (req.body.password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(req.body.password)) {
        return res.status(400).json({ error: "Password must be at least 8 characters long and contain at least one uppercase letter and one number" });
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      cash_balance: updatedUser.cash_balance,
      role: updatedUser.role,
    });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

export default router;
