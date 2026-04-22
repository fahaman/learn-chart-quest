import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/learnchart");
    const users = await User.find({});
    console.log("Registered Users:");
    users.forEach(u => {
      console.log(`- Email: ${u.email}, Role: ${u.role}, Username: ${u.username}`);
    });
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkUsers();
