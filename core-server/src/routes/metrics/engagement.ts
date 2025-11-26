import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patientChats } from "@/models/patient-chats";
import { createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";

// --- Response schema ---
const EngagementResponseSchema = z.object({
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
  operationId: "getEngagementMetrics",
  tags: ["Dashboard"],
  path: "/dashboard/engagement",
  security: [{ jwt: [] }],
  middleware: [jwtMiddleware],
  request: {
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: EngagementResponseSchema } },
      description: "Engagement Metrics",
    },
  },
});

// --- Helpers ---
const safeNumber = (v: number) => (isNaN(v) || !isFinite(v) ? 0 : v);

const calcTrend = (current: number, previous: number) => {
  const c = safeNumber(current);
  const p = safeNumber(previous);
  if (p === 0 && c === 0) return { trend: "0", trendUp: true };
  if (p === 0) return { trend: "100", trendUp: true };
  const growth = ((c - p) / p) * 100;
  return { trend: growth.toFixed(1), trendUp: growth >= 0 };
};

// --- Split user messages into 24h sessions ---
const split24hSessions = (messages: any[]) => {
  if (!messages?.length) return [];
  const sorted = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const sessions: any[][] = [];
  let currentSession: any[] = [];
  let sessionStartTime = new Date(sorted[0].timestamp).getTime();

  for (const msg of sorted) {
    const ts = new Date(msg.timestamp).getTime();
    if (ts - sessionStartTime >= 24 * 60 * 60 * 1000) {
      sessions.push(currentSession);
      currentSession = [];
      sessionStartTime = ts;
    }
    currentSession.push(msg);
  }
  if (currentSession.length) sessions.push(currentSession);
  return sessions;
};

// --- Compute user metrics ---
const computeUserMetrics = (
  sessionsByUser: Map<string, any[][]>,
  rangeMs: number
) => {
  let totalSessions = 0;
  let totalMessages = 0;
  let totalDurationMs = 0;
  const totalActiveDaysArr: number[] = [];
  const messagesPerUserArr: number[] = [];

  for (const sessions of sessionsByUser.values()) {
    const activeDays = new Set<string>();
    let userMessages = 0;
    for (const sess of sessions) {
      totalSessions++;
      userMessages += sess.length;
      totalMessages += sess.length;

      const start = new Date(sess[0].timestamp).getTime();
      const end = new Date(sess[sess.length - 1].timestamp).getTime();
      totalDurationMs += end - start;

      for (const m of sess)
        activeDays.add(new Date(m.timestamp).toDateString());
    }
    totalActiveDaysArr.push(activeDays.size);
    messagesPerUserArr.push(userMessages);
  }

  const totalUsers = sessionsByUser.size || 1;
  const avgSessionsPerUser = totalSessions / totalUsers;
  const avgMessagesPerSession = totalSessions
    ? totalMessages / totalSessions
    : 0;
  const avgSessionDurationSec = totalSessions
    ? totalDurationMs / totalSessions / 1000
    : 0;
  const weekDiff = rangeMs / (1000 * 60 * 60 * 24 * 7);
  const weeklySessionsPerUser = avgSessionsPerUser / weekDiff;
  const avgActiveDaysPerUser = totalActiveDaysArr.length
    ? totalActiveDaysArr.reduce((a, b) => a + b, 0) / totalActiveDaysArr.length
    : 0;

  // Power Users = users with messages > 90th percentile
  const sortedMsgs = [...messagesPerUserArr].sort((a, b) => a - b);
  const p90 = sortedMsgs[Math.floor(sortedMsgs.length * 0.9)] || 0;
  const powerUsers = messagesPerUserArr.filter((m) => m > p90).length;

  return {
    totalSessions,
    totalUsers,
    avgSessionsPerUser,
    avgMessagesPerSession,
    avgSessionDurationSec,
    weeklySessionsPerUser,
    avgActiveDaysPerUser,
    powerUsers,
  };
};

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0s";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  let result = "";
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0) result += `${minutes}m `;
  result += `${seconds}s`;

  return result.trim();
}

// --- Fetch chats for chart (last 7 days from today) ---
const fetchChatsForChart = async () => {
  const now = new Date();
  const startChart = new Date(now);
  startChart.setDate(now.getDate() - 6); // last 7 days including today
  startChart.setHours(0, 0, 0, 0);

  const endChart = new Date(now);
  endChart.setHours(23, 59, 59, 999);

  return db
    .select()
    .from(patientChats)
    .where(
      sql`session_started >= ${startChart.toISOString()} AND session_started <= ${endChart.toISOString()}`
    );
};
// Accept array of objects with the minimal fields needed
const generateChartData = (
  chats: { patientId: string; sessionStarted: Date }[]
) => {
  const chartData: { day: string; users: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    // Unique patient count for that day
    const uniqueUsers = new Set(
      chats
        .filter(
          (s) =>
            new Date(s.sessionStarted) >= dayStart &&
            new Date(s.sessionStarted) <= dayEnd
        )
        .map((s) => s.patientId)
    );

    chartData.push({
      day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
      users: uniqueUsers.size,
    });
  }

  return chartData;
};

// --- Main Handler ---
export const getEngagementMetricsHandler = () => {
  app.openapi(route, async (c) => {
    try {
      const startDateStr = c.req.query("startDate");
      const endDateStr = c.req.query("endDate");

      let start: Date;
      let end: Date;

      if (startDateStr && endDateStr) {
        start = new Date(startDateStr);
        end = new Date(endDateStr);
      } else {
        // Fetch min/max from DB if no dates provided
        const minRow = await db
          .select({ min: sql`MIN(session_started)` })
          .from(patientChats);
        const maxRow = await db
          .select({ max: sql`MAX(session_started)` })
          .from(patientChats);

        const minDate = minRow?.[0]?.min;
        const maxDate = maxRow?.[0]?.max;

        if (!minDate || !maxDate) return c.json({ cards: [], chartData: [] });

        start = new Date(minDate);
        end = new Date(maxDate);
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const rangeMs = end.getTime() - start.getTime();

      // --- Fetch chats ---
      const fetchChats = async (from: Date, to: Date) => {
        return db
          .select()
          .from(patientChats)
          .where(
            sql`session_started >= ${from.toISOString()} AND session_started <= ${to.toISOString()}`
          );
      };

      const currentChats = await fetchChats(start, end);

      // --- Previous period for trend ---
      let previousChats: any[] = [];
      if (startDateStr && endDateStr) {
        const diffDays = Math.ceil(rangeMs / (1000 * 3600 * 24));
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - diffDays);
        prevStart.setHours(0, 0, 0, 0);
        const prevEnd = new Date(start);
        prevEnd.setHours(23, 59, 59, 999);
        previousChats = await fetchChats(prevStart, prevEnd);
      }

      // --- Group sessions by user ---
      const groupSessions = (chats: any[]) => {
        const map = new Map<string, any[][]>();
        for (const chat of chats) {
          const sessions = split24hSessions(chat.messages || []);
          if (!map.has(chat.patientId)) map.set(chat.patientId, []);
          map.set(chat.patientId, [...map.get(chat.patientId)!, ...sessions]);
        }
        return map;
      };

      const currentSessionsByUser = groupSessions(currentChats);
      const prevSessionsByUser = groupSessions(previousChats);

      const currentMetrics = computeUserMetrics(currentSessionsByUser, rangeMs);
      const prevMetrics = computeUserMetrics(prevSessionsByUser, rangeMs);

      // --- Calculate trends ---
      const trends = {
        totalSessions: calcTrend(
          currentMetrics.totalSessions,
          prevMetrics.totalSessions
        ),
        avgSessionsPerUser: calcTrend(
          currentMetrics.avgSessionsPerUser,
          prevMetrics.avgSessionsPerUser
        ),
        avgMessagesPerSession: calcTrend(
          currentMetrics.avgMessagesPerSession,
          prevMetrics.avgMessagesPerSession
        ),
        avgSessionDurationSec: calcTrend(
          currentMetrics.avgSessionDurationSec,
          prevMetrics.avgSessionDurationSec
        ),
        weeklySessionsPerUser: calcTrend(
          currentMetrics.weeklySessionsPerUser,
          prevMetrics.weeklySessionsPerUser
        ),
        avgActiveDaysPerUser: calcTrend(
          currentMetrics.avgActiveDaysPerUser,
          prevMetrics.avgActiveDaysPerUser
        ),
        powerUsers: calcTrend(
          currentMetrics.powerUsers,
          prevMetrics.powerUsers
        ),
      };

      // --- Chart data (last 7 days) ---
      const chartChats = (await fetchChatsForChart()) as Array<{
        patientId: string;
        sessionStarted: Date;
      }>;
      const chartData = generateChartData(chartChats);

      // --- Response ---
      const response = {
        cards: [
          {
            title: "Total Sessions",
            value: currentMetrics.totalSessions.toString(),
            trend: trends.totalSessions.trend,
            trendUp: trends.totalSessions.trendUp,
          },
          {
            title: "Avg Sessions per User",
            value: currentMetrics.avgSessionsPerUser.toFixed(1),
            trend: trends.avgSessionsPerUser.trend,
            trendUp: trends.avgSessionsPerUser.trendUp,
          },
          {
            title: "Avg Messages per Session",
            value: currentMetrics.avgMessagesPerSession.toFixed(1),
            trend: trends.avgMessagesPerSession.trend,
            trendUp: trends.avgMessagesPerSession.trendUp,
          },
          {
            title: "Avg Session Duration",
            value: formatDuration(currentMetrics.avgSessionDurationSec),
            trend: trends.avgSessionDurationSec.trend,
            trendUp: trends.avgSessionDurationSec.trendUp,
          },
          {
            title: "Weekly Sessions per User",
            value: currentMetrics.weeklySessionsPerUser.toFixed(1),
            trend: trends.weeklySessionsPerUser.trend,
            trendUp: trends.weeklySessionsPerUser.trendUp,
          },
          {
            title: "Total Active Days per User",
            value: currentMetrics.avgActiveDaysPerUser.toFixed(1),
            trend: trends.avgActiveDaysPerUser.trend,
            trendUp: trends.avgActiveDaysPerUser.trendUp,
          },
          {
            title: "Power Users",
            value: currentMetrics.powerUsers.toString(),
            trend: trends.powerUsers.trend,
            trendUp: trends.powerUsers.trendUp,
          },
        ],
        chartData,
      };

      return c.json(response, 200);
    } catch (err) {
      console.error("Error in engagement metrics:", err);
      return c.json(
        { ok: false, error: "Failed to fetch engagement metrics" },
        500
      );
    }
  });
};
