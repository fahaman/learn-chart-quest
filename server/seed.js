import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Trade from "./models/Trade.js";
import Position from "./models/Position.js";
import LessonProgress from "./models/LessonProgress.js";
import Watchlist from "./models/Watchlist.js";

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
    console.log("Cleared existing data.");

    // Create a sample user
    const user = await User.create({
      email: "test@example.com",
      password: "password123",
      cash_balance: 50000.0,
      role: "user",
    });
    console.log(`Created sample user: ${user.email}`);

    // Create an admin user
    const admin = await User.create({
      email: "admin@learnchart.com",
      password: "adminpassword",
      cash_balance: 100000.0,
      role: "admin",
    });
    console.log(`Created admin user: ${admin.email}`);

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

    console.log("Seeding completed successfully!");
    process.exit();
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

seedData();
