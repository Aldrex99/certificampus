import { Schema, model, Document, Types } from "mongoose";

export interface ISchool extends Document {
  label: string;
  address?: string;
  region?: string;
  owner: Types.ObjectId;
  subscription?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schoolSchema = new Schema<ISchool>(
  {
    label: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    region: { type: String, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subscription: { type: Schema.Types.ObjectId, ref: "Subscription" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

schoolSchema.index({ label: "text" });

export const School = model<ISchool>("School", schoolSchema);
