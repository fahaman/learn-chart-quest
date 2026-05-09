import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Trade from "../models/Trade.js";
import Position from "../models/Position.js";
import Watchlist from "../models/Watchlist.js";

const router = express.Router();

// Get account complete data
router.get("/portfolio", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const positions = await Position.find({ user_id: req.user._id }).sort({ updatedAt: -1 });
    const trades = await Trade.find({ user_id: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const watchlist = await Watchlist.find({ user_id: req.user._id }).sort({ createdAt: 1 });
    res.json({ cash_balance: user.cash_balance, positions, trades, watchlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute a Trade
router.post("/execute", protect, async (req, res) => {
  const { symbol, side, quantity, price } = req.body;
  const total = quantity * price;
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    let position = await Position.findOne({ user_id: req.user._id, symbol });

    if (side === "BUY") {
      if (user.cash_balance < total) return res.status(400).json({ error: "Insufficient funds" });
      
      user.cash_balance -= total;
      
      if (position) {
        const newQty = position.quantity + quantity;
        position.avg_price = ((position.quantity * position.avg_price) + total) / newQty;
        position.quantity = newQty;
      } else {
        position = new Position({ user_id: req.user._id, symbol, quantity, avg_price: price });
      }
    } else if (side === "SELL") {
      if (!position || position.quantity < quantity) {
        return res.status(400).json({ error: "Insufficient quantity" });
      }
      
      user.cash_balance += total;
      position.quantity -= quantity;
    } else {
      return res.status(400).json({ error: "Invalid side" });
    }

    await user.save();
    if (position.quantity === 0) {
      await Position.deleteOne({ _id: position._id });
    } else {
      await position.save();
    }

    const trade = await Trade.create({ user_id: req.user._id, symbol, side, quantity, price, total });
    res.status(201).json({ message: "Trade executed", trade });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore Balance
router.post("/restore-balance", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cash_balance = 10000;
    await user.save();
    res.json({ message: "Balance restored", cash_balance: user.cash_balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Watchlist API
router.post("/watchlist", protect, async (req, res) => {
  try {
    const exists = await Watchlist.findOne({ user_id: req.user._id, symbol: req.body.symbol });
    if (exists) return res.status(400).json({ error: "Already in watchlist" });
    
    const watch = await Watchlist.create({ user_id: req.user._id, symbol: req.body.symbol });
    res.status(201).json(watch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/watchlist/:id", protect, async (req, res) => {
  try {
    await Watchlist.deleteOne({ _id: req.params.id, user_id: req.user._id });
    res.json({ message: "Removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
