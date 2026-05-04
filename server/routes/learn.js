import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import LessonProgress from "../models/LessonProgress.js";
import Lesson from "../models/Lesson.js";

const router = express.Router();

// Middleware to check admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied: Admins only" });
  }
};

// --- Lesson Progress Routes ---
router.get("/progress", protect, async (req, res) => {
  try {
    const progress = await LessonProgress.find({ user_id: req.user._id });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/progress", protect, async (req, res) => {
  try {
    const { id, completed } = req.body;
    let progress = await LessonProgress.findOne({ user_id: req.user._id, lesson_id: id });
    if (progress) {
      progress.completed = completed;
      await progress.save();
    } else {
      progress = await LessonProgress.create({ user_id: req.user._id, lesson_id: id, completed });
    }
    res.status(201).json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Lessons CRUD Routes ---
router.get("/lessons", protect, async (req, res) => {
  try {
    const lessons = await Lesson.find({}).sort({ level: 1, order_index: 1 });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/lessons", protect, adminOnly, async (req, res) => {
  try {
    const { title, description, youtube_id, level, duration_min } = req.body;
    const lesson = await Lesson.create({ title, description, youtube_id, level, duration_min });
    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/lessons/:id", protect, adminOnly, async (req, res) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    await LessonProgress.deleteMany({ lesson_id: req.params.id });
    res.json({ message: "Lesson removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
