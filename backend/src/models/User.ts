import { Schema, model, Document, Types } from "mongoose";
import { UserRole } from "../types";

export interface IUser extends Document {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: UserRole;
  school?: Types.ObjectId;
  isVerified: boolean;
  activationToken?: string | null;
  activationExpires?: Date | null;
  resetToken?: string | null;
  resetExpires?: Date | null;
  refreshTokenHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["school", "admin"], default: "school" },
    school: { type: Schema.Types.ObjectId, ref: "School" },
    isVerified: { type: Boolean, default: false },
    activationToken: { type: String, default: null, select: false },
    activationExpires: { type: Date, default: null, select: false },
    resetToken: { type: String, default: null, select: false },
    resetExpires: { type: Date, default: null, select: false },
    refreshTokenHash: { type: String, default: null, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.password;
        delete ret.activationToken;
        delete ret.activationExpires;
        delete ret.resetToken;
        delete ret.resetExpires;
        delete ret.refreshTokenHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const User = model<IUser>("User", userSchema);
