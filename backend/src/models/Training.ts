import { Schema, model, Document, Types } from "mongoose";

export interface ITraining extends Document {
  label: string;
  description?: string;
  level?: string;
  school: Types.ObjectId;
  specialities: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const trainingSchema = new Schema<ITraining>(
  {
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    level: { type: String, trim: true },
    school: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    specialities: [{ type: Schema.Types.ObjectId, ref: "Speciality" }],
  },
  { timestamps: true },
);

export const Training = model<ITraining>("Training", trainingSchema);
