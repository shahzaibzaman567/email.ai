import type { Request, Response } from "express";
import { EmailLogModel } from "../db/models/email-log.model.js";
import { UserModel } from "../db/models/user.model.js";
import { ok } from "../lib/response.js";

export async function getAdminDashboard(req: Request, res: Response): Promise<void> {
  const startOf30DaysAgo = new Date();
  startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);
  startOf30DaysAgo.setHours(0, 0, 0, 0);

  const [totalUsers, dailySent, dailyActiveUsers] = await Promise.all([
    UserModel.countDocuments({ role: "user" }),

    EmailLogModel.aggregate([
      {
        $match: {
          status: "sent",
          sentAt: { $gte: startOf30DaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$sentAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    EmailLogModel.aggregate([
      {
        $match: {
          sentAt: { $gte: startOf30DaysAgo }
        }
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$sentAt" } },
            userId: "$userId"
          }
        }
      },
      {
        $group: {
          _id: "$_id.day",
          activeUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  // Format charts data
  const charts = [];
  const dayMap = new Map();

  // Populate last 30 days
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dayMap.set(dateStr, { date: dateStr, sentCount: 0, activeUsers: 0 });
  }

  dailySent.forEach((item) => {
    if (dayMap.has(item._id)) {
      dayMap.get(item._id).sentCount = item.count;
    }
  });

  dailyActiveUsers.forEach((item) => {
    if (dayMap.has(item._id)) {
      dayMap.get(item._id).activeUsers = item.activeUsers;
    }
  });

  const dailyStats = Array.from(dayMap.values()).reverse();

  res.json(ok("Admin stats fetched successfully", {
    totalUsers,
    dailyStats
  }));
}
