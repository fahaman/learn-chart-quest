import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Trade from "./models/Trade.js";
import Position from "./models/Position.js";
import LessonProgress from "./models/LessonProgress.js";
import Watchlist from "./models/Watchlist.js";
import Lesson from "./models/Lesson.js";

dotenv.config({ path: "../.env" });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/learnchart");
    console.log("Connected to MongoDB for seeding...");

    // Clear existing data
    await User.deleteMany({});
    await Trade.deleteMany({});
    await Position.deleteMany({});
    await LessonProgress.deleteMany({});
    await Watchlist.deleteMany({});
    await Lesson.deleteMany({});
    console.log("Cleared existing data.");

    // Create a sample user
    const user = await User.create({
      name: "Test User",
      username: "testuser",
      email: "test@example.com",
      phone: "1234567890",
      password: "password123",
      cash_balance: 50000.0,
      role: "user",
    });
    console.log(`Created sample user: ${user.email}`);

    // Delete existing admin if any
    await User.deleteOne({ email: "adminlearn@chart.com" });
    
    // Create fresh admin
    const admin = new User({
      name: "Admin User",
      username: "admin",
      email: "adminlearn@chart.com",
      phone: "0000000000",
      password: "Admin@2026", // Will be hashed by pre-save hook
      role: "admin",
      cash_balance: 1000000
    });
    
    await admin.save();
    console.log("Admin account reset successfully!");
    console.log("Email: adminlearn@chart.com");
    console.log("Password: Admin@2026");

    // Sample Trades for test user
    const trades = [
      {
        user_id: user._id,
        symbol: "AAPL",
        side: "BUY",
        quantity: 10,
        price: 150.0,
        total: 1500.0,
      },
      {
        user_id: user._id,
        symbol: "TSLA",
        side: "BUY",
        quantity: 5,
        price: 700.0,
        total: 3500.0,
      },
      {
        user_id: user._id,
        symbol: "AAPL",
        side: "SELL",
        quantity: 5,
        price: 160.0,
        total: 800.0,
      },
    ];
    await Trade.insertMany(trades);
    console.log("Inserted sample trades.");

    // Sample Positions for test user
    const positions = [
      {
        user_id: user._id,
        symbol: "AAPL",
        quantity: 5,
        avg_price: 150.0,
      },
      {
        user_id: user._id,
        symbol: "TSLA",
        quantity: 5,
        avg_price: 700.0,
      },
      {
        user_id: user._id,
        symbol: "BTCUSDT",
        quantity: 0.1,
        avg_price: 45000.0,
      },
    ];
    await Position.insertMany(positions);
    console.log("Inserted sample positions.");

    // Sample Lesson Progress
    const progress = [
      { user_id: user._id, lesson_id: "intro-to-trading", completed: true },
      { user_id: user._id, lesson_id: "charting-basics", completed: true },
      { user_id: user._id, lesson_id: "risk-management", completed: false },
    ];
    await LessonProgress.insertMany(progress);
    console.log("Inserted sample lesson progress.");

    // Sample Watchlist
    const watchlist = [
      { user_id: user._id, symbol: "AAPL" },
      { user_id: user._id, symbol: "TSLA" },
      { user_id: user._id, symbol: "GOOGL" },
      { user_id: user._id, symbol: "MSFT" },
      { user_id: user._id, symbol: "AMZN" },
    ];
    await Watchlist.insertMany(watchlist);
    console.log("Inserted sample watchlist.");

    // Sample Lessons
    const STATIC_LESSONS = [
      { title: "What is Trading?", description: "Introduction to financial markets.", youtube_id: "Xn7KWR9EOGQ", level: "Beginner", order_index: 1, duration_min: 5 },
      { title: "How to read a Chart", description: "Candlesticks and timeframes.", youtube_id: "AqOyW0GFlhM", level: "Beginner", order_index: 2, duration_min: 8 },
      { title: "Support and Resistance", description: "Key price levels.", youtube_id: "rtHWvHbLmZk", level: "Intermediate", order_index: 1, duration_min: 12 },
      { title: "Moving Averages", description: "Trend confirmation tools.", youtube_id: "JqXULuWZXZc", level: "Intermediate", order_index: 2, duration_min: 10 },
      { title: "Risk Management", description: "Position sizing and stop losses.", youtube_id: "WN8YM0DVybg", level: "Advanced", order_index: 1, duration_min: 15 },
      { title: "Trading Psychology", description: "Controlling emotions during trades.", youtube_id: "uvoiHcfp9DE", level: "Advanced", order_index: 2, duration_min: 14 }
    ];
    await Lesson.insertMany(STATIC_LESSONS);
    console.log("Inserted sample lessons.");

    console.log("Seeding completed successfully!");
    process.exit();
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

seedData();
