import { UserModel } from "../db/models/user.model.js";
import type { ClerkAuth } from "../lib/clerk.js";

const knownUsers = new Set<string>();

export async function ensureUser(auth: ClerkAuth): Promise<void> {
  if (knownUsers.has(auth.userId)) return;

  const update: Record<string, unknown> = { clerkId: auth.userId };
  if (auth.email) update.email = auth.email;

  await UserModel.updateOne(
    { clerkId: auth.userId },
    { $setOnInsert: update },
    { upsert: true },
  ).exec();

  knownUsers.add(auth.userId);
}