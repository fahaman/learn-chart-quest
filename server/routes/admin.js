import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Trade from "../models/Trade.js";
import Watchlist from "../models/Watchlist.js";
import LessonProgress from "../models/LessonProgress.js";

import Position from "../models/Position.js";

const router = express.Router();

// Middleware to check for admin role
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied: Admins only" });
  }
};

router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const [users, trades, watchlists, progress] = await Promise.all([
      User.find({}).select("-password"),
      Trade.find({}).sort({ createdAt: -1 }).limit(500),
      Watchlist.find({}),
      LessonProgress.find({ completed: true }),
    ]);

    res.json({ profiles: users, trades, watchlist: watchlists, progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Delete a user and all related data
// @route   DELETE /api/admin/users/:id
router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't allow deleting yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot delete your own admin account" });
    }

    // Delete all associated data
    await Promise.all([
      User.findByIdAndDelete(userId),
      Trade.deleteMany({ user_id: userId }),
      Position.deleteMany({ user_id: userId }),
      Watchlist.deleteMany({ user_id: userId }),
      LessonProgress.deleteMany({ user_id: userId }),
    ]);

    res.json({ message: "User and all associated data deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
