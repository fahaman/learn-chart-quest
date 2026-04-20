import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Trade from "../models/Trade.js";
import Watchlist from "../models/Watchlist.js";
import LessonProgress from "../models/LessonProgress.js";

const router = express.Router();

router.get("/stats", protect, async (req, res) => {
  if (req.user.email !== "admin@learnchart.com") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const [users, trades, watchlists, progress] = await Promise.all([
      User.find({}),
      Trade.find({}).sort({ createdAt: -1 }).limit(500),
      Watchlist.find({}),
      LessonProgress.find({ completed: true }),
    ]);

    res.json({ profiles: users, trades, watchlist: watchlists, progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
