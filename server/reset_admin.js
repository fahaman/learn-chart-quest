import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const resetAdmin = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/learnchart";
    console.log(`Connecting to ${uri}...`);
    await mongoose.connect(uri);
    
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
    
    process.exit();
  } catch (error) {
    console.error("Error resetting admin:", error);
    process.exit(1);
  }
};

resetAdmin();
