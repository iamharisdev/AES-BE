import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patient } from "@/models/patient";
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

// --- Helpers ---
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const checkOnboardingCompleted = (p: any) => !!(p.cnic && p.name);

const getPreviousPeriod = (start: Date, end: Date) => {
  const diffDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 3600 * 24)
  );
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - diffDays);
  prevStart.setHours(0, 0, 0, 0);

  const prevEnd = new Date(start);
  prevEnd.setHours(23, 59, 59, 999);

  return { prevStart, prevEnd };
};

const getUniqueUsers = (chats: { patientId: string }[]) =>
  new Set(chats.map((c) => c.patientId));

// --- Main Handler ---
export const getReachActivationMetricsHandler = () => {
  app.openapi(route, async (c) => {
    try {
      const startDateStr = c.req.query("startDate");
      const endDateStr = c.req.query("endDate");
      const now = new Date();

      let start: Date, end: Date;
      if (startDateStr && endDateStr) {
        start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
      } else {
        const minRow = await db
          .select({ min: sql`MIN(session_started)` })
          .from(patientChats);
        const maxRow = await db
          .select({ max: sql`MAX(session_started)` })
          .from(patientChats);
        const minDate = minRow?.[0]?.min as string | undefined;
        const maxDate = maxRow?.[0]?.max as string | undefined;

        if (!minDate || !maxDate) return c.json({ cards: [], chartData: [] });

        start = new Date(minDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(maxDate);
        end.setHours(23, 59, 59, 999);
      }

      const fetchChats = async (
        from?: Date,
        to?: Date
      ): Promise<
        { patientId: string; session_started: string; messages?: any[] }[]
      > => {
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
      const { prevStart, prevEnd } = getPreviousPeriod(start, end);
      const previousChats = await fetchChats(prevStart, prevEnd);

      const currentUniqueUsers = getUniqueUsers(currentChats);
      const previousUniqueUsers = getUniqueUsers(previousChats);

      // --- Active Users (last 2 weeks from today) ---
      const day = new Date();
      day.setHours(23, 59, 59, 999);

      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(day.getDate() - 13);
      twoWeeksAgo.setHours(0, 0, 0, 0);

      const last2WeeksChats = await fetchChats(twoWeeksAgo, day);
      const activeUsers = getUniqueUsers(last2WeeksChats);

      // Previous 14-day period before last 2 weeks
      const prevTwoWeeksStart = new Date();
      prevTwoWeeksStart.setDate(twoWeeksAgo.getDate() - 14);
      prevTwoWeeksStart.setHours(0, 0, 0, 0);

      const prevTwoWeeksEnd = new Date();
      prevTwoWeeksEnd.setDate(twoWeeksAgo.getDate() - 1);
      prevTwoWeeksEnd.setHours(23, 59, 59, 999);

      const prev2WeeksChats = await fetchChats(
        prevTwoWeeksStart,
        prevTwoWeeksEnd
      );
      const previousActiveUsers = getUniqueUsers(prev2WeeksChats);

      // --- Retention Rate ---
      const allChats = await fetchChats();
      const firstSessionsMap = new Map<string, Date>();
      allChats.forEach((chat) => {
        const firstMsg = new Date(chat.session_started);
        if (
          !firstSessionsMap.has(chat.patientId) ||
          firstSessionsMap.get(chat.patientId)! > firstMsg
        ) {
          firstSessionsMap.set(chat.patientId, firstMsg);
        }
      });

      let retainedCount = 0;
      firstSessionsMap.forEach((firstDate, patientId) => {
        const retentionEnd = new Date(firstDate);
        retentionEnd.setDate(retentionEnd.getDate() + 14);
        const hasReturn = allChats.some(
          (chat) =>
            chat.patientId === patientId &&
            new Date(chat.session_started) > firstDate &&
            new Date(chat.session_started) <= retentionEnd
        );
        if (hasReturn) retainedCount++;
      });
      const retentionRate = (retainedCount / firstSessionsMap.size) * 100 || 0;

      const prevAllChats = await fetchChats(
        new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
        new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      );
      const prevFirstSessionsMap = new Map<string, Date>();
      prevAllChats.forEach((chat) => {
        const firstMsg = new Date(chat.session_started);
        if (
          !prevFirstSessionsMap.has(chat.patientId) ||
          prevFirstSessionsMap.get(chat.patientId)! > firstMsg
        ) {
          prevFirstSessionsMap.set(chat.patientId, firstMsg);
        }
      });

      let prevRetainedCount = 0;
      prevFirstSessionsMap.forEach((firstDate, patientId) => {
        const retentionEnd = new Date(firstDate);
        retentionEnd.setDate(retentionEnd.getDate() + 14);
        const hasReturn = prevAllChats.some(
          (chat) =>
            chat.patientId === patientId &&
            new Date(chat.session_started) > firstDate &&
            new Date(chat.session_started) <= retentionEnd
        );
        if (hasReturn) prevRetainedCount++;
      });
      const previousRetentionRate =
        (prevRetainedCount / prevFirstSessionsMap.size) * 100 || 0;

      // --- Churn Rate ---
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
        999
      );

      const prevMonthChats = await fetchChats(prevMonthStart, prevMonthEnd);
      const currentMonthChats = await fetchChats(currentMonthStart, now);

      const prevMonthUsers = getUniqueUsers(prevMonthChats);
      const currentMonthUsers = getUniqueUsers(currentMonthChats);
      const churnCount = Array.from(prevMonthUsers).filter(
        (u) => !currentMonthUsers.has(u)
      ).length;
      const churnRate = (churnCount / prevMonthUsers.size) * 100 || 0;

      const prevPrevMonthStart = new Date(
        prevMonthStart.getFullYear(),
        prevMonthStart.getMonth() - 1,
        1
      );
      const prevPrevMonthEnd = new Date(
        prevMonthStart.getFullYear(),
        prevMonthStart.getMonth(),
        0,
        23,
        59,
        59,
        999
      );
      const prevPrevMonthChats = await fetchChats(
        prevPrevMonthStart,
        prevPrevMonthEnd
      );
      const prevPrevMonthUsers = getUniqueUsers(prevPrevMonthChats);
      const prevChurnCount = Array.from(prevPrevMonthUsers).filter(
        (u) => !prevMonthUsers.has(u)
      ).length;

      const previousChurnRate =
        (prevChurnCount / prevPrevMonthUsers.size) * 100 || 0;

      // --- Total Messages ---
      const totalMessages = currentChats.reduce(
        (acc, chat) => acc + (chat.messages?.length || 0),
        0
      );
      const previousTotalMessages = previousChats.reduce(
        (acc, chat) => acc + (chat.messages?.length || 0),
        0
      );

      // --- Onboarding (date filtered) ---
      const patientsData = await db.select().from(patient);
      const onboardedPatients = patientsData.filter(
        (p) =>
          p.createdAt >= start &&
          p.createdAt <= end &&
          checkOnboardingCompleted(p)
      );
      const onboardingCompletionRate =
        (onboardedPatients.length / patientsData.length) * 100 || 0;

      const previousOnboardedPatients = patientsData.filter(
        (p) =>
          p.createdAt >= prevStart &&
          p.createdAt <= prevEnd &&
          checkOnboardingCompleted(p)
      );
      const previousOnboardingCompletionRate =
        (previousOnboardedPatients.length / patientsData.length) * 100 || 0;

      // --- Chart Data (last 7 days) ---
      const chartData: { day: string; users: number }[] = [];
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const last7DaysChats = await db
        .select()
        .from(patientChats)
        .where(
          sql`session_started >= ${sevenDaysAgo.toISOString()} AND session_started <= ${today.toISOString()}`
        );

      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

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
      const response = {
        cards: [
          {
            title: "Unique Users",
            value: currentUniqueUsers.size.toLocaleString(),
            trend: calculateTrend(
              currentUniqueUsers.size,
              previousUniqueUsers.size
            ).toString(),
            trendUp:
              calculateTrend(
                currentUniqueUsers.size,
                previousUniqueUsers.size
              ) >= 0,
          },
          {
            title: "Active Users",
            value: activeUsers.size.toLocaleString(),
            subtitle: "currently active (last 2 weeks)",
            trend: calculateTrend(
              activeUsers.size,
              previousActiveUsers.size
            ).toString(),
            trendUp:
              calculateTrend(activeUsers.size, previousActiveUsers.size) >= 0,
          },
          {
            title: "Retention Rate",
            value: retentionRate.toFixed(1),
            subtitle: "%",
            trend: calculateTrend(
              retentionRate,
              previousRetentionRate
            ).toString(),
            trendUp: calculateTrend(retentionRate, previousRetentionRate) >= 0,
          },
          {
            title: "Churn Rate",
            value: churnRate.toFixed(1),
            subtitle: "%",
            trend: calculateTrend(churnRate, previousChurnRate).toString(),
            trendUp: calculateTrend(churnRate, previousChurnRate) <= 0,
          },
          {
            title: "Total Messages",
            value: totalMessages.toLocaleString(),
            trend: calculateTrend(
              totalMessages,
              previousTotalMessages
            ).toString(),
            trendUp: calculateTrend(totalMessages, previousTotalMessages) >= 0,
          },
          {
            title: "Onboarding Completion Rate",
            value: onboardingCompletionRate.toFixed(1),
            subtitle: "%",
            trend: calculateTrend(
              onboardingCompletionRate,
              previousOnboardingCompletionRate
            ).toString(),
            trendUp:
              calculateTrend(
                onboardingCompletionRate,
                previousOnboardingCompletionRate
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
