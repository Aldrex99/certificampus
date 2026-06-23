import { Schema, model, Document, Types } from "mongoose";
import { DiplomaState } from "../types";

export interface IDiploma extends Document {
  student: Types.ObjectId;
  school: Types.ObjectId;
  training?: Types.ObjectId;
  speciality?: Types.ObjectId;
  template?: Types.ObjectId;
  grade?: string;
  graduationDate?: Date;
  fileUrl?: string;
  qrToken: string;
  state: DiplomaState;
  isValid: boolean;
  generatedAt?: Date;
  publishedAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const diplomaSchema = new Schema<IDiploma>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    school: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    training: { type: Schema.Types.ObjectId, ref: "Training" },
    speciality: { type: Schema.Types.ObjectId, ref: "Speciality" },
    template: { type: Schema.Types.ObjectId, ref: "TemplateDiploma" },
    grade: { type: String, trim: true },
    graduationDate: { type: Date },
    fileUrl: { type: String },
    qrToken: { type: String, required: true, unique: true, index: true },
    state: {
      type: String,
      enum: ["draft", "generated", "published"],
      default: "generated",
    },
    isValid: { type: Boolean, default: true },
    generatedAt: { type: Date },
    publishedAt: { type: Date },
    sentAt: { type: Date },
  },
  { timestamps: true },
);

export const Diploma = model<IDiploma>("Diploma", diplomaSchema);
