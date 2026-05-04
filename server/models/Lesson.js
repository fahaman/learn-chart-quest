import mongoose from "mongoose";

const lessonSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    youtube_id: { type: String, required: true },
    level: { type: String, required: true, enum: ["Beginner", "Intermediate", "Advanced"] },
    duration_min: { type: Number, default: 5 },
    order_index: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Lesson", lessonSchema);
