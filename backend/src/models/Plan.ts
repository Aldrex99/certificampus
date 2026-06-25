import { Schema, model, Document } from "mongoose";

export type PlanInterval = "month" | "year";

export interface IPlan extends Document {
  name: string;
  description?: string;
  /** Price in euros (whole units), charged per interval. */
  price: number;
  interval: PlanInterval;
  /** Number of certificates the school may issue per billing period. */
  certificateQuota: number;
  /** Existing Stripe Price id (price_…). Optional: created on the fly otherwise. */
  stripePriceId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    interval: {
      type: String,
      enum: ["month", "year"],
      default: "month",
    },
    certificateQuota: { type: Number, required: true, min: 1 },
    stripePriceId: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Plan = model<IPlan>("Plan", planSchema);
