import mongoose from "mongoose";
import User from "./models/User.js";
import Trade from "./models/Trade.js";
import Position from "./models/Position.js";
import LessonProgress from "./models/LessonProgress.js";
import Watchlist from "./models/Watchlist.js";
import Lesson from "./models/Lesson.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/learnchart");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Explicitly create collections so they appear in MongoDB even if empty
    await User.createCollection().catch(() => {});
    await Trade.createCollection().catch(() => {});
    await Position.createCollection().catch(() => {});
    await LessonProgress.createCollection().catch(() => {});
    await Watchlist.createCollection().catch(() => {});
    await Lesson.createCollection().catch(() => {});
    
    console.log("All database collections ensured.");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
