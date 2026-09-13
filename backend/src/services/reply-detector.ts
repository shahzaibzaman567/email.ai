import { ImapFlow } from "imapflow";
import { LeadModel } from "../db/models/lead.model.js";
import { EmailLogModel } from "../db/models/email-log.model.js";
import { decrypt } from "../lib/encryption.js";
import { logger } from "../lib/logger.js";

export interface ReplyCheckResult {
  userId: string;
  repliesFound: number;
  leadsUpdated: string[];
}

async function getLastCheckTime(userId: string): Promise<Date> {
  const lastLog = await EmailLogModel.findOne({ userId, status: "sent" })
    .sort({ sentAt: -1 })
    .select("sentAt")
    .lean();
  
  if (lastLog?.sentAt) {
    const d = new Date(lastLog.sentAt);
    d.setHours(d.getHours() - 24);
    return d;
  }
  
  const d = new Date();
  d.setHours(d.getHours() - 24);
  return d;
}

export async function detectRepliesForUser(
  userId: string,
  email: string,
  imapAppPassword: string
): Promise<ReplyCheckResult> {
  const result: ReplyCheckResult = { userId, repliesFound: 0, leadsUpdated: [] };

  let client: ImapFlow | null = null;

  try {
    const decryptedPassword = decrypt(imapAppPassword);
    
    const domain = email.split("@")[1]?.toLowerCase();
    let imapHost = "imap.gmail.com";
    let imapPort = 993;
    
    if (domain === "outlook.com" || domain === "hotmail.com" || domain === "live.com") {
      imapHost = "outlook.office365.com";
      imapPort = 993;
    } else if (domain === "yahoo.com") {
      imapHost = "imap.mail.yahoo.com";
      imapPort = 993;
    }

    client = new ImapFlow({
      host: imapHost,
      port: imapPort,
      secure: true,
      auth: { user: email, pass: decryptedPassword },
      logger: false,
    });

    await client.connect();

    const lastCheck = await getLastCheckTime(userId);
    const sinceDate = lastCheck.toISOString().split("T")[0];

    const sentEmails = await EmailLogModel.find({
      userId,
      status: "sent",
      providerMessageId: { $exists: true, $ne: null },
    })
      .select("providerMessageId recipient leadId")
      .lean();

    const messageIdMap = new Map<string, string>();
    for (const log of sentEmails) {
      if (log.providerMessageId) {
        const cleanId = log.providerMessageId.replace(/[<>]/g, "").trim();
        messageIdMap.set(cleanId.toLowerCase(), log.leadId.toString());
      }
    }

    // Helper: process one email source for reply matching
    const processEmailSource = async (source: string): Promise<string | null> => {
      const inReplyToMatch = source.match(/In-Reply-To:\s*<([^>]+)>/i);
      const referencesMatch = source.match(/References:\s*(.+)/i);

      let matchedLeadId: string | null = null;

      if (inReplyToMatch) {
        const inReplyTo = inReplyToMatch[1].toLowerCase();
        matchedLeadId = messageIdMap.get(inReplyTo) || null;
      }

      if (!matchedLeadId && referencesMatch) {
        const refs = referencesMatch[1].toLowerCase();
        for (const [msgId, leadId] of messageIdMap.entries()) {
          if (refs.includes(msgId)) {
            matchedLeadId = leadId;
            break;
          }
        }
      }

      if (!matchedLeadId) {
        const fromMatch = source.match(/From:\s*(.+)/i);
        if (fromMatch) {
          const fromEmail = fromMatch[1].match(/<([^>]+)>/)?.[1] || fromMatch[1].trim();
          const lead = await LeadModel.findOne({
            userId,
            email: fromEmail.toLowerCase(),
            status: { $nin: ["replied", "unsubscribed"] },
          }).select("_id").lean();

          if (lead) {
            matchedLeadId = lead._id.toString();
          }
        }
      }

      return matchedLeadId;
    };

    // Helper: scan one mailbox folder for replies
    const scanFolder = async (folderName: string): Promise<void> => {
      const safeClient = client!;
      let lock;
      try {
        lock = await safeClient.getMailboxLock(folderName);
      } catch {
        // Folder does not exist on this account, skip silently
        return;
      }
      try {
        const searchResults = await safeClient.search(
          { since: new Date(sinceDate) },
          { uid: true }
        );

        if (!searchResults || searchResults.length === 0) return;

        const uids = Array.isArray(searchResults) ? searchResults : [];

        for (const uid of uids) {
          try {
            const msg = await safeClient.fetchOne(uid, { source: true, uid: true }, { uid: true });
            if (!msg || !("source" in msg) || !msg.source) continue;

            const source = typeof msg.source === "string" ? msg.source : msg.source.toString();

            const matchedLeadId = await processEmailSource(source);

            if (matchedLeadId) {
              const lead = await LeadModel.findOne({
                _id: matchedLeadId,
                userId,
                status: { $nin: ["replied", "unsubscribed"] },
              }).lean();

              if (lead) {
                await LeadModel.updateOne(
                  { _id: matchedLeadId },
                  { $set: { status: "replied" } }
                );

                // Find the latest sent email log for this lead to update its status
                // This ensures Campaign stats get updated on the dashboard
                const emailLog = await EmailLogModel.findOne({
                  leadId: matchedLeadId,
                  status: "sent"
                }).sort({ createdAt: -1 });

                if (emailLog) {
                  await EmailLogModel.updateOne(
                    { _id: emailLog._id },
                    { $set: { status: "replied", updatedAt: new Date() } }
                  );
                  
                  // Trigger campaign stats update
                  try {
                    const { updateCampaignStats } = await import("./email-log.service.js");
                    await updateCampaignStats(emailLog.campaignId);
                  } catch (statErr) {
                    logger.error("Failed to update campaign stats on reply", { error: String(statErr) });
                  }
                }
                result.repliesFound++;
                result.leadsUpdated.push(matchedLeadId);
                logger.info("Reply detected and lead updated", {
                  userId,
                  leadId: matchedLeadId,
                  email: lead.email,
                  folder: folderName,
                });
              }
            }
          } catch (err) {
            logger.warn("Error processing email for reply detection", { uid, folder: folderName, error: String(err) });
          }
        }
      } finally {
        lock.release();
      }
    };

    // Scan all common folders where replies could land (including Spam/Junk)
    const foldersToScan = [
      "INBOX",
      "[Gmail]/Spam",
      "[Gmail]/All Mail",
      "Junk",
      "Junk Email",
      "Spam",
    ];

    for (const folder of foldersToScan) {
      await scanFolder(folder);
    }

    await client.logout();
  } catch (err) {
    logger.error("Reply detection failed", { userId, email, error: String(err) });
    if (client) {
      try { await client.logout(); } catch {}
    }
  }

  return result;
}
