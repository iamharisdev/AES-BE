import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patientChats } from "@/models/patient-chats";
import { createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";

// --- Response schema ---
const SuccessResponseSchema = z.object({
  cards: z.array(
    z.object({
      title: z.string(),
      value: z.string(),
      subtitle: z.string().optional(),
      trend: z.string(),
      trendUp: z.boolean(),
    })
  ),
  chartData: z.array(
    z.object({
      day: z.string(),
      users: z.number(),
    })
  ),
});

const route = createRoute({
  method: "get",
  operationId: "getReachActivationMetrics",
  tags: ["Dashboard"],
  path: "/dashboard/reach-activation",
  summary: "Get Reach & Activation Metrics for Dashboard",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    query: z.object({
      startDate: z
        .string()
        .datetime()
        .optional()
        .describe("Start of range (ISO)"),
      endDate: z.string().datetime().optional().describe("End of range (ISO)"),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: SuccessResponseSchema } },
      description: "Reach & Activation Metrics",
    },
  },
});

// --- Helper: Trend ---
const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  const percent = ((current - previous) / previous) * 100;
  return Math.round(percent);
};

// --- Helper: 24h sessions per user ---
const calculateSessionsPerUser = (messages: any[]) => {
  if (!messages || messages.length === 0) return 0;

  const sorted = messages
    .map((m) => new Date(m.timestamp))
    .sort((a, b) => a.getTime() - b.getTime());

  let sessionCount = 1;
  let sessionStart = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].getTime() - sessionStart.getTime();
    if (diff > 24 * 60 * 60 * 1000) {
      sessionCount++;
      sessionStart = sorted[i];
    }
  }

  return sessionCount;
};

// --- Helper: Onboarding ---
const checkOnboardingCompleted = (messages: any[]) => {
  const onboardingFields = ["cnic", "name", "menu"];
  const first20 = messages.slice(0, 20);

  return onboardingFields.every((field) =>
    first20.some(
      (msg) =>
        msg.sender?.toLowerCase() === "user" &&
        msg.message?.toLowerCase()?.includes(field)
    )
  );
};

// --- Main Handler ---
export const getReachActivationMetricsHandler = () => {
  app.openapi(route, async (c) => {
    try {
      const startDateStr = c.req.query("startDate");
      const endDateStr = c.req.query("endDate");

      const now = new Date();
      let start: Date;
      let end: Date;

      // --- Determine date range ---
      if (startDateStr && endDateStr) {
        start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
      } else {
        // No dates → fetch min/max from DB
        const minRow = await db
          .select({ min: sql`MIN(session_started)` })
          .from(patientChats);
        const maxRow = await db
          .select({ max: sql`MAX(session_started)` })
          .from(patientChats);

        const minDate = minRow?.[0]?.min;
        const maxDate = maxRow?.[0]?.max;

        if (!minDate || !maxDate) {
          return c.json({ cards: [], chartData: [] });
        }

        start = new Date(minDate);
        start.setHours(0, 0, 0, 0);

        end = new Date(maxDate);
        end.setHours(23, 59, 59, 999);
      }

      // --- Fetch chats ---
      const fetchChats = async (from?: Date, to?: Date) => {
        if (from && to) {
          return db
            .select()
            .from(patientChats)
            .where(
              sql`session_started >= ${from.toISOString()} AND session_started <= ${to.toISOString()}`
            );
        }
        return db.select().from(patientChats);
      };

      const currentChats = await fetchChats(start, end);

      // --- Previous period for trend ---
      let previousChats: any[] = [];
      if (startDateStr && endDateStr) {
        const diffDays = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 3600 * 24)
        );
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - diffDays);
        prevStart.setHours(0, 0, 0, 0);

        const prevEnd = new Date(start);
        prevEnd.setHours(23, 59, 59, 999);

        previousChats = await fetchChats(prevStart, prevEnd);
      }

      // --- Process Metrics ---
      const processMetrics = (chats: any[]) => {
        const userMap = new Map<string, any[]>();
        chats.forEach((chat) => {
          if (!userMap.has(chat.patientId)) userMap.set(chat.patientId, []);
          userMap.get(chat.patientId)!.push(chat);
        });

        let totalSessions = 0;
        let totalMessages = 0;
        let onboardingCompleted = 0;
        const activeDaysSet = new Set<string>();
        const sessionsPerUserList: number[] = [];
        let totalSessionDurationSec = 0;

        for (const [userId, userChats] of userMap?.entries()) {
          let userMessages: any[] = [];
          userChats.forEach((uc) => {
            userMessages = userMessages.concat(uc.messages || []);
          });

          const userSessions = calculateSessionsPerUser(userMessages);
          sessionsPerUserList.push(userSessions);
          totalSessions += userSessions;
          totalMessages += userMessages.length;

          if (checkOnboardingCompleted(userMessages)) onboardingCompleted++;

          // Active days per user
          const days = new Set(
            userMessages.map((m) => new Date(m.timestamp).toDateString())
          );
          days.forEach((d) => activeDaysSet.add(`${userId}_${d}`));

          // Session duration
          if (userMessages.length > 0) {
            const first = new Date(userMessages[0].timestamp).getTime();
            const last = new Date(
              userMessages[userMessages.length - 1].timestamp
            ).getTime();
            totalSessionDurationSec += (last - first) / 1000;
          }
        }

        const totalUsers = userMap.size;
        const avgSessionsPerUser = totalUsers ? totalSessions / totalUsers : 0;
        const avgMessagesPerSession = totalSessions
          ? totalMessages / totalSessions
          : 0;
        const avgSessionDurationSec = totalSessions
          ? totalSessionDurationSec / totalSessions
          : 0;

        // Power users (90th percentile)
        const sorted = [...sessionsPerUserList].sort((a, b) => a - b);
        const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
        const powerUsers = sorted.filter((x) => x >= p90).length;

        return {
          totalUsers,
          totalSessions,
          avgSessionsPerUser,
          totalMessages,
          avgMessagesPerSession,
          avgSessionDurationSec,
          totalActiveDays: activeDaysSet.size,
          powerUsers,
          onboardingCompletedRate: totalUsers
            ? (onboardingCompleted / totalUsers) * 100
            : 0,
        };
      };

      const currentMetrics = processMetrics(currentChats);
      const previousMetrics = processMetrics(previousChats);

      // --- Chart Data: Unique Users Trend (Last 7 Days) ---
      // const chartData: { day: string; users: number }[] = [];
      // const today = new Date();

      // for (let i = 6; i >= 0; i--) {
      //   const dayStart = new Date(today);
      //   dayStart.setDate(today.getDate() - i);
      //   dayStart.setHours(0, 0, 0, 0);

      //   const dayEnd = new Date(dayStart);
      //   dayEnd.setHours(23, 59, 59, 999);

      //   // Filter chats for the day and get unique patientIds
      //   const uniqueUsers = new Set(
      //     currentChats
      //       .filter(
      //         (chat) =>
      //           new Date(chat.sessionStarted) >= dayStart &&
      //           new Date(chat.sessionStarted) <= dayEnd
      //       )
      //       .map((chat) => chat.patientId)
      //   );

      //   chartData.push({
      //     day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
      //     users: uniqueUsers.size,
      //   });
      // }

      // --- Current date & 7 days ago ---
      const nows = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(nows.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0); // start of 7 days ago

      // --- Fetch chats for last 7 days ---
      const last7DaysChats = await db
        .select()
        .from(patientChats)
        .where(
          sql`session_started >= ${sevenDaysAgo.toISOString()} AND session_started <= ${now.toISOString()}`
        );

      // --- Generate chart data: Unique Users Trend (Last 7 Days) ---
      const chartData: { day: string; users: number }[] = [];

      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        // Filter chats for this day & count unique patientIds
        const uniqueUsers = new Set(
          last7DaysChats
            .filter(
              (chat) =>
                new Date(chat.sessionStarted) >= dayStart &&
                new Date(chat.sessionStarted) <= dayEnd
            )
            .map((chat) => chat.patientId)
        );

        chartData.push({
          day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
          users: uniqueUsers.size,
        });
      }

      // chartData now has 7 entries, last 7 days from today

      // --- Build Response ---
      const response = {
        cards: [
          {
            title: "Unique Users",
            value: currentMetrics.totalUsers.toLocaleString(),
            trend: calculateTrend(
              currentMetrics.totalUsers,
              previousMetrics.totalUsers
            ).toString(),
            trendUp:
              calculateTrend(
                currentMetrics.totalUsers,
                previousMetrics.totalUsers
              ) >= 0,
          },
          {
            title: "Active Users",
            value: currentMetrics.totalUsers.toLocaleString(),
            subtitle: "currently active",
            trend: calculateTrend(
              currentMetrics.totalUsers,
              previousMetrics.totalUsers
            ).toString(),
            trendUp:
              calculateTrend(
                currentMetrics.totalUsers,
                previousMetrics.totalUsers
              ) >= 0,
          },
          {
            title: "Total Messages",
            value: currentMetrics.totalMessages.toLocaleString(),
            trend: calculateTrend(
              currentMetrics.totalMessages,
              previousMetrics.totalMessages
            ).toString(),
            trendUp:
              calculateTrend(
                currentMetrics.totalMessages,
                previousMetrics.totalMessages
              ) >= 0,
          },
          {
            title: "Onboarding Completion Rate",
            value: currentMetrics.onboardingCompletedRate.toFixed(1),
            subtitle: "completed",
            trend: calculateTrend(
              currentMetrics.onboardingCompletedRate,
              previousMetrics.onboardingCompletedRate
            ).toString(),
            trendUp:
              calculateTrend(
                currentMetrics.onboardingCompletedRate,
                previousMetrics.onboardingCompletedRate
              ) >= 0,
          },
          {
            title: "Total Active Days per User",
            value: currentMetrics.totalActiveDays.toString(),
            trend: calculateTrend(
              currentMetrics.totalActiveDays,
              previousMetrics.totalActiveDays
            ).toString(),
            trendUp:
              calculateTrend(
                currentMetrics.totalActiveDays,
                previousMetrics.totalActiveDays
              ) >= 0,
          },
          {
            title: "Power Users",
            value: currentMetrics.powerUsers.toString(),
            trend: calculateTrend(
              currentMetrics.powerUsers,
              previousMetrics.powerUsers
            ).toString(),
            trendUp:
              calculateTrend(
                currentMetrics.powerUsers,
                previousMetrics.powerUsers
              ) >= 0,
          },
        ],
        chartData,
      };

      return c.json(response, 200);
    } catch (err) {
      console.error("Error in reach-activation:", err);
      return c.json({ error: "Failed to fetch metrics" }, 500);
    }
  });
};
