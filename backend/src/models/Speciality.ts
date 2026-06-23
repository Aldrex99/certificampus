import { Schema, model, Document, Types } from "mongoose";

export interface ISpeciality extends Document {
  label: string;
  description?: string;
  school: Types.ObjectId; // ref School
  createdAt: Date;
  updatedAt: Date;
}

const specialitySchema = new Schema<ISpeciality>(
  {
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    school: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export const Speciality = model<ISpeciality>("Speciality", specialitySchema);
