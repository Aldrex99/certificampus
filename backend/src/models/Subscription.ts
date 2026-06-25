import { Schema, model, Document, Types } from "mongoose";
import { SubscriptionStatus } from "../types";

export interface ISubscription extends Document {
  /** The plan this subscription is based on. */
  plan?: Types.ObjectId;
  school?: Types.ObjectId;
  status: SubscriptionStatus;

  // Usage tracking for the current billing period.
  /** Certificates already issued during the current period. */
  usedThisPeriod: number;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;

  // Stripe linkage (empty in mock mode).
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSessionId?: string;

  // Legacy descriptive fields, kept for backward compatibility.
  name?: string;
  type?: "monthly" | "yearly" | "one-time";
  price?: number;
  startDate?: Date;
  endDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    plan: { type: Schema.Types.ObjectId, ref: "Plan" },
    school: { type: Schema.Types.ObjectId, ref: "School" },
    status: {
      type: String,
      enum: ["active", "pending", "cancelled", "expired"],
      default: "pending",
    },

    usedThisPeriod: { type: Number, default: 0, min: 0 },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },

    stripeCustomerId: { type: String, trim: true },
    stripeSubscriptionId: { type: String, trim: true },
    stripeSessionId: { type: String, trim: true },

    name: { type: String, trim: true },
    type: {
      type: String,
      enum: ["monthly", "yearly", "one-time"],
    },
    price: { type: Number, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true },
);

export const Subscription = model<ISubscription>(
  "Subscription",
  subscriptionSchema,
);
