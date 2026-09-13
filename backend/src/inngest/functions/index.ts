import { campaignLaunch } from "./campaign-launch.function.js";
import { sendCampaignEmail } from "./send-campaign-email.function.js";
import { checkReplies, scheduledReplyCheck } from "./check-replies.function.js";

export const inngestFunctions = [campaignLaunch, sendCampaignEmail, checkReplies, scheduledReplyCheck];