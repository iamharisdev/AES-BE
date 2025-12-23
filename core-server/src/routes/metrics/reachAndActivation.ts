import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patient } from "@/models/patient";
import { patientChats } from "@/models/patient-chats";
import { createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const PKT = "Asia/Karachi";

// --- Response schema ---
const SuccessResponseSchema = z.object({
  cards: z.array(
    z.object({
      title: z.string(),
      value: z.string(),
      subtitle: z.string().optional(),
      trend: z.string(),
      trendUp: z.boolean(),
      userList: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            phone: z.string(),
            lastActivity: z.string().nullable(),
          })
        )
        .optional(),
    })
  ),
  chartData: z.array(
    z.object({
      day: z.string(),
      users: z.number(),
    })
  ),
  allMessagesCount: z.number(),
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
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
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
  if (previous <10 ) return 0
 
  return ((current - previous) /   previous) * 100;
};

const checkOnboardingCompleted = (p: any) => !!p.menu;

const getUniqueUsers = (
  chats: { patientId: string; messages?: any[] }[]
): Set<string> => {
  return new Set(
    chats
      .filter((c) => c.messages && c.messages.length > 0) // only users with messages
      .map((c) => c.patientId)
  );
};

const getPreviousPeriod = (start: Date, end: Date) => {
  // Number of days in the current period
  const diffDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 3600 * 24)
  );

  // Previous period start = current start - diffDays
  const prevStart = dayjs(start)
    .tz(PKT)
    .subtract(diffDays, "day")
    .startOf("day")
    .toDate();

  // Previous period end = day before current start
  const prevEnd = dayjs(start).tz(PKT).subtract(1, "day").endOf("day").toDate();

  return { prevStart, prevEnd };
};

const resolvePeriods = (startDateStr?: string, endDateStr?: string) => {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (startDateStr && endDateStr) {
    start = new Date(startDateStr);
    end = new Date(endDateStr);
  } else {
    end = now;
    start = new Date(now);
    start.setDate(start.getDate() - 29); // default 30 days
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const diffDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - diffDays);
  prevStart.setHours(0, 0, 0, 0);

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  prevEnd.setHours(23, 59, 59, 999);

  return { start, end, prevStart, prevEnd };
};

const getActiveUsersInPeriod = async (from: Date, to: Date) => {
  const chats = await db
    .select({
      patientId: patientChats.patientId,
    })
    .from(patientChats)
    .where(
      sql`session_started >= ${from.toISOString()} AND session_started <= ${to.toISOString()}`
    );

  return new Set(chats.map((c) => c.patientId));
};

const getTodayMessagesCount = async () => {
  const today = new Date();
  const from = new Date(today);
  from.setHours(0, 0, 0, 0); // start of today
  const to = new Date(today);
  to.setHours(23, 59, 59, 999); // end of today

  // Fetch all chats for today
  const chats = await db
    .select()
    .from(patientChats)
    .where(
      sql`session_started >= ${from.toISOString()} AND session_started <= ${to.toISOString()}`
    );

  // Calculate total messages
  const totalMessages = chats.reduce(
    (acc, chat) => acc + (chat.messages?.length || 0),
    0
  );

  return {
    day: from.toLocaleDateString("en-CA").slice(0, 10),
    messageCount: totalMessages,
  };
};

// --- Main Handler ---
export const getReachActivationMetricsHandler = () => {
  app.openapi(route, async (c) => {
    try {
      const startDateStr = c.req.query("startDate");
      const endDateStr = c.req.query("endDate");
      const now = new Date();

      let start: Date, end: Date;

      if (startDateStr && endDateStr) {
        // Use frontend provided dates, convert to PKT start/end of day
        start = dayjs(startDateStr).tz(PKT).startOf("day").toDate();
        end = dayjs(endDateStr).tz(PKT).endOf("day").toDate();
      } else {
        // Fetch min/max from database
        const minRow = await db
          .select({ min: sql`MIN(session_started)` })
          .from(patientChats);
        const maxRow = await db
          .select({ max: sql`MAX(session_started)` })
          .from(patientChats);
        const minDate = minRow?.[0]?.min as string | undefined;
        const maxDate = maxRow?.[0]?.max as string | undefined;

        if (!minDate || !maxDate) return c.json({ cards: [], chartData: [] });

        // Convert min/max dates to PKT start/end of day
        start = dayjs(minDate).tz(PKT).startOf("day").toDate();
        end = dayjs(maxDate).tz(PKT).endOf("day").toDate();
      }

      // --- Fetch chats helper ---
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
      const allMessagesCount = await getTodayMessagesCount();
      const currentChats = await fetchChats(start, end);
      const allChats = await fetchChats(); // all chats for lastActivity

      const { prevStart, prevEnd } = getPreviousPeriod(start, end);
      const previousChats = await fetchChats(prevStart, prevEnd);

      // --- Unique and Active Users ---
      const currentUniqueUsers = new Set(
        currentChats
          .filter((c) => c.messages && c.messages.length > 0) // ✅ only chats with messages
          .map((c) => c.patientId)
      );

      const day = new Date();
      day.setHours(23, 59, 59, 999);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(day.getDate() - 13);
      twoWeeksAgo.setHours(0, 0, 0, 0);

      const last2WeeksChats = await fetchChats(twoWeeksAgo, day);
      const activeUsers = new Set(
        last2WeeksChats
          .filter((c) => c.messages && c.messages.length > 0)
          .map((c) => c.patientId)
      );

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
      const previousActiveUsers = new Set(
        prev2WeeksChats
          .filter((c) => c.messages && c.messages.length > 0)
          .map((c) => c.patientId)
      );

      // --- Map patient info ---
      const patientsData = await db.select().from(patient);
      const patientsMap = new Map(patientsData.map((p) => [p.id, p]));

      // --- Map user list with lastActivity from latest message ---
      const mapUserList = (userIds: Set<string>) =>
        Array.from(userIds).map((id) => {
          const userChats = allChats.filter((c) => c.patientId === id);
          let lastActivity: string | null = null;

          userChats.forEach((chat) => {
            if (chat.messages?.length) {
              const latestMsgTime = chat.messages
                .map((m: any) => new Date(m.timestamp))
                .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0];
              if (!lastActivity || new Date(lastActivity) < latestMsgTime) {
                lastActivity = latestMsgTime.toISOString();
              }
            }
          });

          const patientData = patientsMap.get(id);

          return {
            id,
            name: patientData?.name || "Unknown",
            phone: patientData?.phoneNumber || "",
            lastActivity,
          };
        });

      // --- Retention Rate ---
      // =======================
      // RETENTION RATE
      // =======================

      const {
        start: resolvedStart,
        end: resolvedEnd,
        prevStart: resolvedPrevStart,
        prevEnd: resolvedPrevEnd,
      } = resolvePeriods(startDateStr, endDateStr);

      // users active in current period
      const currentActiveUsers = await getActiveUsersInPeriod(
        resolvedStart,
        resolvedEnd
      );

      // find first session of every user
      const firstSessionRows = await db
        .select({
          patientId: patientChats.patientId,
          firstSession: sql`MIN(session_started)`,
        })
        .from(patientChats)
        .groupBy(patientChats.patientId);

      const eligibleUsers = firstSessionRows
        .filter((u) => new Date(u.firstSession as string) < start)
        .map((u) => u.patientId);

      let retainedUsers = 0;
      for (const userId of eligibleUsers) {
        if (currentActiveUsers.has(userId)) {
          retainedUsers++;
        }
      }

      const retentionRate =
        eligibleUsers.length > 0
          ? (retainedUsers / eligibleUsers.length) * 100
          : 0;

      const prevActiveUsers = await getActiveUsersInPeriod(prevStart, prevEnd);

      const prevEligibleUsers = firstSessionRows
        .filter((u) => new Date(u.firstSession as string) < prevStart)
        .map((u) => u.patientId);

      let prevRetained = 0;
      for (const userId of prevEligibleUsers) {
        if (prevActiveUsers.has(userId)) {
          prevRetained++;
        }
      }

      const previousRetentionRate =
        prevEligibleUsers.length > 0
          ? (prevRetained / prevEligibleUsers.length) * 100
          : 0;

      const retainedUserIds = new Set<string>();
      for (const userId of eligibleUsers) {
        if (currentActiveUsers.has(userId)) {
          retainedUserIds.add(userId);
        }
      }

      // --- Churn Rate ---
      // =======================
      // CHURN RATE
      // =======================

      const prevPeriodUsers = await getActiveUsersInPeriod(
        resolvedPrevStart,
        resolvedPrevEnd
      );
      const currentPeriodUsers = getActiveUsersInPeriod(
        resolvedStart,
        resolvedEnd
      );

      let churnedUsers = 0;
      for (const userId of prevPeriodUsers) {
        if (!(await currentPeriodUsers).has(userId)) {
          churnedUsers++;
        }
      }

      const churnRate =
        prevPeriodUsers.size > 0
          ? (churnedUsers / prevPeriodUsers.size) * 100
          : 0;
      const prevPrevStart = new Date(prevStart);
      const prevPrevEnd = new Date(prevEnd);

      prevPrevStart.setDate(
        prevPrevStart.getDate() - (prevEnd.getDate() - prevStart.getDate() + 1)
      );
      prevPrevStart.setHours(0, 0, 0, 0);

      prevPrevEnd.setDate(
        prevPrevEnd.getDate() - (prevEnd.getDate() - prevStart.getDate() + 1)
      );
      prevPrevEnd.setHours(23, 59, 59, 999);

      const prevPrevUsers = await getActiveUsersInPeriod(
        prevPrevStart,
        prevPrevEnd
      );

      let prevChurned = 0;
      for (const userId of prevPrevUsers) {
        if (!prevPeriodUsers.has(userId)) {
          prevChurned++;
        }
      }

      const previousChurnRate =
        prevPrevUsers.size > 0 ? (prevChurned / prevPrevUsers.size) * 100 : 0;

      const churnedUserIds = new Set<string>();
      for (const userId of prevPeriodUsers) {
        if (!(await currentPeriodUsers).has(userId)) {
          churnedUserIds.add(userId);
        }
      }

      // --- Total Messages ---
      const totalMessages = currentChats.reduce(
        (acc, chat) => acc + (chat.messages?.length || 0),
        0
      );
      // Total user messages
      const totalUserMessages = currentChats.reduce((acc, chat) => {
        const userMessages =
          chat.messages?.filter((msg) => msg.sender === "user").length || 0;
        return acc + userMessages;
      }, 0);

      // Total assistant messages
      const totalAssistantMessages = currentChats.reduce((acc, chat) => {
        const assistantMessages =
          chat.messages?.filter((msg) => msg.sender === "assistant").length ||
          0;
        return acc + assistantMessages;
      }, 0);
      const previousTotalMessages = previousChats.reduce(
        (acc, chat) => acc + (chat.messages?.length || 0),
        0
      );

      // --- Onboarding Completion ---
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

      const onboardedUserIds = new Set(onboardedPatients.map((p) => p.id));

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
        dayStart.setDate(today.getDate() - i);
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

      // --- Final Response ---
      const response = {
        cards: [
          {
            title: "Unique Users",
            value: currentUniqueUsers.size.toLocaleString(),
            trend: calculateTrend(
              currentUniqueUsers.size,
              getUniqueUsers(previousChats).size
            ).toString(),
            trendUp:
              calculateTrend(
                currentUniqueUsers.size,
                getUniqueUsers(previousChats).size
              ) >= 0,
            userList: mapUserList(currentUniqueUsers),
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
            userList: mapUserList(activeUsers),
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
            userList: mapUserList(retainedUserIds),
          },
          {
            title: "Churn Rate",
            value: churnRate.toFixed(1),
            subtitle: "%",
            trend: calculateTrend(churnRate, previousChurnRate).toString(),
            trendUp: calculateTrend(churnRate, previousChurnRate) <= 0,
            userList: mapUserList(churnedUserIds),
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
            title: "Total User Messages",
            value: totalUserMessages.toLocaleString(),
            trend: calculateTrend(totalUserMessages, totalMessages).toString(),
            trendUp: calculateTrend(totalUserMessages, totalMessages) >= 0,
          },
          {
            title: "Total Assistent Messages",
            value: totalAssistantMessages.toLocaleString(),
            trend: calculateTrend(
              totalAssistantMessages,
              totalMessages
            ).toString(),
            trendUp: calculateTrend(totalAssistantMessages, totalMessages) >= 0,
          },
          {
            title: "Onboarding Completion Rate",
            value: `${onboardingCompletionRate.toFixed(1)}%`,
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
            userList: mapUserList(onboardedUserIds),
          },
        ],
        chartData,
        allMessagesCount: allMessagesCount.messageCount,
      };

      return c.json(response, 200);
    } catch (err) {
      console.error("Error in reach-activation:", err);
      return c.json({ error: "Failed to fetch metrics" }, 500);
    }
  });
};
