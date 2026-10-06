import "dotenv/config";
import mongoose from "mongoose";
import { EmailLogModel } from "./src/db/models/email-log.model.js";
import { ColdEmailSettingsModel } from "./src/db/models/settings.model.js";

async function main() {
  await mongoose.connect(process.env.DATABASE_URL!);
  const logs = await EmailLogModel.find({}).sort({ sentAt: -1 }).limit(5);
  console.log("Recent Email Logs:");
  logs.forEach(l => console.log(`- ${l.recipient}: status=${l.status}, provider=${l.provider}, sentAt=${l.sentAt}`));
  
  const settings = await ColdEmailSettingsModel.findOne();
  console.log("Settings GAS URL:", settings?.gasWebhookUrl ? settings.gasWebhookUrl : "Not set");
  
  await mongoose.disconnect();
}
main();
