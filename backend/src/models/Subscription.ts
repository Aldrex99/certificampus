import { Schema, model, Document, Types } from "mongoose";
import { SubscriptionStatus } from "../types";

export interface ISubscription extends Document {
  name: string;
  type: "monthly" | "yearly" | "one-time";
  price: number;
  status: SubscriptionStatus;
  school?: Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["monthly", "yearly", "one-time"],
      default: "monthly",
    },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "pending", "cancelled", "expired"],
      default: "pending",
    },
    school: { type: Schema.Types.ObjectId, ref: "School" },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true },
);

export const Subscription = model<ISubscription>(
  "Subscription",
  subscriptionSchema,
);
