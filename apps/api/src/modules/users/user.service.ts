import { User } from "./user.model.js";

export function findUserById(id: string) {
  return User.findById(id).select("-passwordHash");
}

export function updateUserProfile(id: string, data: { name?: string; addresses?: unknown[] }) {
  return User.findByIdAndUpdate(id, data, { new: true }).select("-passwordHash");
}

export function listUsers(page = 1, limit = 20) {
  return Promise.all([
    User.find().select("-passwordHash").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(),
  ]);
}

export function updateUserRole(id: string, role: "customer" | "admin") {
  return User.findByIdAndUpdate(id, { role }, { new: true }).select("-passwordHash");
}
