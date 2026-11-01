import { Schema, model } from "mongoose";

export interface CategoryDoc {
  name: string;
  slug: string;
  parentId?: Schema.Types.ObjectId;
}

const categorySchema = new Schema<CategoryDoc>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  parentId: { type: Schema.Types.ObjectId, ref: "Category" },
});

export const Category = model<CategoryDoc>("Category", categorySchema);
