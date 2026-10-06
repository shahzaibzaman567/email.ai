import mongoose from "mongoose";
import { env } from "e:/projects/email.ai/backend/src/config/env.js";
import { detectRepliesForUser } from "e:/projects/email.ai/backend/src/services/reply-detector.js";
import { ColdEmailSettingsModel } from "e:/projects/email.ai/backend/src/db/models/settings.model.js";

async function main() {
  await mongoose.connect(env.mongodbUri);
  console.log("Connected to MongoDB.");

  const settings = await ColdEmailSettingsModel.findOne({
    smtpFrom: { $exists: true, $ne: null },
    imapPassword: { $exists: true, $ne: null },
  }).lean();

  if (!settings) {
    console.log("No user found with IMAP configured.");
    process.exit(0);
  }

  console.log(`Running reply detection for user: ${settings.userId} (${settings.smtpFrom})`);
  
  try {
    const result = await detectRepliesForUser(
      settings.userId.toString(),
      settings.smtpFrom!,
      settings.imapPassword!
    );
    console.log("Detection completed:", result);
  } catch (err) {
    console.error("Detection failed:", err);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
