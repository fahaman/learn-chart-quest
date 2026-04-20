import mongoose from "mongoose";

const positionSchema = mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    avg_price: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Position", positionSchema);
