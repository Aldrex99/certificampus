import { Schema, model, Document, Types } from "mongoose";

export interface ITemplateDiploma extends Document {
  name: string;
  content: string;
  isDefault: boolean;
  school?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const templateDiplomaSchema = new Schema<ITemplateDiploma>(
  {
    name: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    school: { type: Schema.Types.ObjectId, ref: "School", default: null },
  },
  { timestamps: true },
);

export const TemplateDiploma = model<ITemplateDiploma>(
  "TemplateDiploma",
  templateDiplomaSchema,
);
