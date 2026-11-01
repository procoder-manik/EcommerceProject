import { Schema, model } from "mongoose";

export interface UserDoc {
  name: string;
  email: string;
  passwordHash: string;
  role: "customer" | "admin";
  provider: "local" | "google";
  addresses: { line1: string; city: string; postalCode: string; country: string }[];
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    addresses: [
      {
        line1: String,
        city: String,
        postalCode: String,
        country: String,
      },
    ],
  },
  { timestamps: true }
);

export const User = model<UserDoc>("User", userSchema);
