import { Schema, model, Document, Types } from "mongoose";
import { StudentStatus } from "../types";

export interface IStudent extends Document {
  firstname: string;
  lastname: string;
  email: string;
  school: Types.ObjectId;
  training?: Types.ObjectId;
  speciality?: Types.ObjectId;
  status: StudentStatus;
  grade?: string;
  graduationDate?: Date;
  isCertified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    school: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    training: { type: Schema.Types.ObjectId, ref: "Training" },
    speciality: { type: Schema.Types.ObjectId, ref: "Speciality" },
    status: { type: String, enum: ["admis", "ajourne"], default: "ajourne" },
    grade: { type: String, trim: true },
    graduationDate: { type: Date },
    isCertified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// A learner email is unique within a given school.
studentSchema.index({ school: 1, email: 1 }, { unique: true });

export const Student = model<IStudent>("Student", studentSchema);
