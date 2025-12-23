import app from "@/app";
import { db } from "@/db";
import { jwtMiddleware } from "@/middleware/jwt";
import { patientChats } from "@/models/patient-chats";
import { createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { patient } from "@/models/patient";

dayjs.extend(utc);
dayjs.extend(timezone);

const PKT = "Asia/Karachi";

// =======================
// RESPONSE SCHEMA
// =======================
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

// =======================
// HELPERS
// =======================
const safeNumber = (v: number) => (isNaN(v) || !isFinite(v) ? 0 : v);

const calcTrend = (current: number, previous: number) => {
  if (previous < 10) return { trend: "0", trendUp: true };

  const growth = ((current - previous) / previous) * 100;
  return { trend: growth.toFixed(1), trendUp: growth >= 0 };
};

// =======================
// 24-HOUR SESSION SPLIT
// =======================
const split24hSessions = (messages: any[]) => {
  if (!messages?.length) return [];

  const sorted = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const sessions: any[][] = [];
  let sessionStart = new Date(sorted[0].timestamp).getTime();
  let currentSession: any[] = [];

  for (const msg of sorted) {
    const time = new Date(msg.timestamp).getTime();

    if (time - sessionStart >= 24 * 60 * 60 * 1000) {
      sessions.push(currentSession);
      currentSession = [];
      sessionStart = time;
    }

    currentSession.push(msg);
  }

  if (currentSession.length) sessions.push(currentSession);
  return sessions;
};

// =======================
// METRIC CALCULATION
// =======================
// const computeUserMetrics = (
//   sessionsByUser: Map<string, any[][]>,
//   rangeMs: number
// ) => {
//   let totalSessions = 0;
//   let totalMessages = 0;
//   let totalDurationMs = 0;
//   let totalActiveDaysArr: number[] = [];
//   const messagesPerUserArr: { userId: string; count: number }[] = [];

//   for (const [userId, sessions] of sessionsByUser.entries()) {
//     const activeDays = new Set<string>();
//     let userMessages = 0;

//     for (const sess of sessions) {
//       if (!sess.length) continue;

//       totalSessions++;
//       totalMessages += sess.length;
//       userMessages += sess.length;

//       const start = new Date(sess[0].timestamp).getTime();
//       const end = new Date(sess[sess.length - 1].timestamp).getTime();
//       totalDurationMs += Math.max(0, end - start);

//       for (const m of sess) {
//         activeDays.add(new Date(m.timestamp).toDateString());
//       }
//     }

//     totalActiveDaysArr.push(activeDays.size);
//     messagesPerUserArr.push({ userId, count: userMessages });
//   }

//   const totalUsers = sessionsByUser.size || 1;

//   const avgSessionsPerUser = totalSessions / totalUsers;

//   const avgMessagesPerSession = totalSessions
//     ? totalMessages / totalSessions
//     : 0;

//   const avgSessionDurationSec = totalSessions
//     ? totalDurationMs / totalSessions / 1000
//     : 0;

//   const daysInRange = Math.max(1, Math.ceil(rangeMs / (24 * 60 * 60 * 1000)));
//   const weeklySessionsPerUser = (avgSessionsPerUser * daysInRange) / 7;

//   const avgActiveDaysPerUser = totalActiveDaysArr.length
//     ? totalActiveDaysArr.reduce((a, b) => a + b, 0) / totalActiveDaysArr.length
//     : 0;

//   // =======================
//   // Updated Power Users Calculation
//   // =======================
//   const sortedByMessages = [...messagesPerUserArr].sort(
//     (a, b) => a.count - b.count
//   );

//   const index90 = Math.floor(0.9 * sortedByMessages.length);
//   const p90 = sortedByMessages[index90]?.count || 0;

//   const powerUsers = messagesPerUserArr.filter((u) => u.count > p90).length;

//   return {
//     totalSessions,
//     totalUsers,
//     avgSessionsPerUser,
//     avgMessagesPerSession,
//     avgSessionDurationSec,
//     weeklySessionsPerUser,
//     avgActiveDaysPerUser,
//     powerUsers,
//   };
// };

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

const allChats = await fetchChats(); // all chats for lastActivity
// --- Map patient info ---
const patientsData = await db.select().from(patient);
const patientsMap = new Map(patientsData.map((p) => [p.id, p]));

// --- Map user list with lastActivity from latest message ---
const mapUserList = (userIds: Set<string>) =>
  Array.from(userIds).map((id) => {
    // allChats = aapke DB se fetch kiye hue sare chats
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

    // patientsMap = DB se fetch kiye hue patient data ka Map
    const patientData = patientsMap.get(id);

    return {
      id,
      name: patientData?.name || "Unknown",
      phone: patientData?.phoneNumber || "",
      lastActivity,
    };
  });

const computeUserMetrics = (
  sessionsByUser: Map<string, any[][]>,
  rangeMs: number
) => {
  let totalSessions = 0;
  let totalMessages = 0;
  let totalDurationMs = 0;
  let totalActiveDaysArr: number[] = [];

  // 👇 yahin define ho raha hai (pehle yahin tha, bas return nahi hota tha)
  const messagesPerUserArr: { userId: string; count: number }[] = [];

  for (const [userId, sessions] of sessionsByUser.entries()) {
    const activeDays = new Set<string>();
    let userMessages = 0;

    for (const sess of sessions) {
      if (!sess.length) continue;

      totalSessions++;
      totalMessages += sess.length;
      userMessages += sess.length;

      const start = new Date(sess[0].timestamp).getTime();
      const end = new Date(sess[sess.length - 1].timestamp).getTime();
      totalDurationMs += Math.max(0, end - start);

      for (const m of sess) {
        activeDays.add(new Date(m.timestamp).toDateString());
      }
    }

    totalActiveDaysArr.push(activeDays.size);
    messagesPerUserArr.push({ userId, count: userMessages });
  }

  const totalUsers = sessionsByUser.size || 1;

  const avgSessionsPerUser = totalSessions / totalUsers;
  const avgMessagesPerSession = totalSessions
    ? totalMessages / totalSessions
    : 0;

  const avgSessionDurationSec = totalSessions
    ? totalDurationMs / totalSessions / 1000
    : 0;

  const daysInRange = Math.max(1, Math.ceil(rangeMs / (24 * 60 * 60 * 1000)));
  const weeklySessionsPerUser = (avgSessionsPerUser * daysInRange) / 7;

  const avgActiveDaysPerUser = totalActiveDaysArr.length
    ? totalActiveDaysArr.reduce((a, b) => a + b, 0) / totalActiveDaysArr.length
    : 0;

  // =======================
  // ✅ POWER USERS (P90 logic – SAME as before)
  // =======================
  const sortedByMessages = [...messagesPerUserArr].sort(
    (a, b) => a.count - b.count
  );

  const index90 = Math.floor(0.9 * sortedByMessages.length);
  const p90 = sortedByMessages[index90]?.count || 0;

  const powerUserIds = new Set(
    messagesPerUserArr.filter((u) => u.count > p90).map((u) => u.userId)
  );

  return {
    totalSessions,
    totalUsers,
    avgSessionsPerUser,
    avgMessagesPerSession,
    avgSessionDurationSec,
    weeklySessionsPerUser,
    avgActiveDaysPerUser,
    powerUsers: powerUserIds.size, // 👈 pehle jaisa count
    powerUserIds, // 👈 NEW: list
  };
};

// =======================
// DURATION FORMATTER
// =======================
function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0s";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  let out = "";
  if (hours) out += `${hours}h `;
  if (minutes) out += `${minutes}m `;
  out += `${seconds}s`;

  return out.trim();
}

// =======================
// CHART QUERIES
// =======================
const fetchChatsForChart = async () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return db
    .select()
    .from(patientChats)
    .where(
      sql`session_started >= ${start.toISOString()} AND session_started <= ${end.toISOString()}`
    );
};

const generateChartData = (chats: any[]) => {
  const result: any[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d1 = new Date(now);
    d1.setDate(now.getDate() - i);
    d1.setHours(0, 0, 0, 0);

    const d2 = new Date(d1);
    d2.setHours(23, 59, 59, 999);

    const users = new Set(
      chats
        .filter(
          (x) =>
            new Date(x.sessionStarted) >= d1 && new Date(x.sessionStarted) <= d2
        )
        .map((x) => x.patientId)
    );

    result.push({
      day: d1.toLocaleDateString("en-US", { weekday: "short" }),
      users: users.size,
    });
  }

  return result;
};

// =======================
// MAIN HANDLER
// =======================
export const getEngagementMetricsHandler = () => {
  app.openapi(route, async (c) => {
    try {
      const startDateStr = c.req.query("startDate");
      const endDateStr = c.req.query("endDate");

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

      const rangeMs = end.getTime() - start.getTime();

      const fetchChats = async (from: Date, to: Date) => {
        return db
          .select()
          .from(patientChats)
          .where(
            sql`session_started >= ${from.toISOString()} AND session_started <= ${to.toISOString()}`
          );
      };

      const currentChats = await fetchChats(start, end);

      // PREVIOUS PERIOD FOR TREND
      let previousChats: any[] = [];
      if (startDateStr && endDateStr) {
        const diffDays = Math.ceil(rangeMs / (1000 * 3600 * 24));
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - diffDays);

        const prevEnd = new Date(start);
        prevEnd.setHours(23, 59, 59, 999);

        previousChats = await fetchChats(prevStart, prevEnd);
      }

      // GROUP BY USER
      const makeSessionMap = (rows: any[]) => {
        const map = new Map<string, any[][]>();
        for (const chat of rows) {
          const sessions = split24hSessions(chat.messages || []);
          if (!map.has(chat.patientId)) map.set(chat.patientId, []);
          map.get(chat.patientId)!.push(...sessions);
        }
        return map;
      };

      const currentMap = makeSessionMap(currentChats);
      const prevMap = makeSessionMap(previousChats);

      const currentMetrics = computeUserMetrics(currentMap, rangeMs);
      const prevMetrics = computeUserMetrics(prevMap, rangeMs);

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

      // CHART DATA
      const chartChats = await fetchChatsForChart();
      const chartData = generateChartData(chartChats);

      return c.json(
        {
          cards: [
            {
              title: "Total Sessions",
              value: String(currentMetrics.totalSessions),
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
              value: String(currentMetrics.powerUsers),
              trend: trends.powerUsers.trend,
              trendUp: trends.powerUsers.trendUp,
              userList: mapUserList(currentMetrics.powerUserIds),
            },
          ],
          chartData,
        },
        200
      );
    } catch (err) {
      console.error("ERROR in engagement metrics:", err);
      return c.json(
        { ok: false, error: "Failed to fetch engagement metrics" },
        500
      );
    }
  });
};
