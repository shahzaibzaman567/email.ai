import { Schema, model } from "mongoose";

export interface IUser {
  clerkId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: "user" | "owner";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    firstName: { type: String, trim: true, maxlength: 100 },
    lastName: { type: String, trim: true, maxlength: 100 },
    role: { type: String, enum: ["user", "owner"], default: "user" },
  },
  { timestamps: true },
);

userSchema.index({ clerkId: 1 }, { unique: true });

export const UserModel = model<IUser>("User", userSchema);