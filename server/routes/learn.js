import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import LessonProgress from "../models/LessonProgress.js";

const router = express.Router();

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

export default router;
