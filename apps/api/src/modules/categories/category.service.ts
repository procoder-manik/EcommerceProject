import { Category } from "./category.model.js";

export function listCategories() {
  return Category.find().sort({ name: 1 });
}

export function createCategory(data: { name: string; slug: string; parentId?: string }) {
  return Category.create(data);
}

export function updateCategory(id: string, data: Partial<{ name: string; slug: string; parentId: string }>) {
  return Category.findByIdAndUpdate(id, data, { new: true });
}
