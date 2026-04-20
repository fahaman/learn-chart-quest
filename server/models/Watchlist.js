import mongoose from "mongoose";

const watchlistSchema = mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    symbol: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Watchlist", watchlistSchema);
